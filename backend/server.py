from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import shutil
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    MERCHANT = "merchant"
    ADMIN = "admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REFUSED = "refused"
    COMPLETED = "completed"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.MERCHANT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    image_url: str
    stock: int
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock: int

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    available: Optional[bool] = None

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer: CustomerInfo
    items: List[OrderItem]
    total: float
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer: CustomerInfo
    items: List[OrderItem]
    total: float

class OrderUpdateStatus(BaseModel):
    status: OrderStatus

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(required_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(email=user_data.email, role=user_data.role)
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user.email, "role": user.role})
    
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password')
    user = User(**user_doc)
    token = create_access_token({"sub": user.email, "role": user.role})
    
    return {"user": user, "token": token}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Product endpoints
@api_router.post("/products", response_model=Product)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Save image
    image_filename = f"{uuid.uuid4()}_{image.filename}"
    image_path = UPLOADS_DIR / image_filename
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        image_url=f"/uploads/{image_filename}"
    )
    
    product_doc = product.model_dump()
    product_doc['created_at'] = product_doc['created_at'].isoformat()
    await db.products.insert_one(product_doc)
    
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return Product(**product)

@api_router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    current_user: User = Depends(require_role([UserRole.MERCHANT, UserRole.ADMIN]))
):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.products.update_one({"id": product_id}, {"$set": update_dict})
        product.update(update_dict)
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Check stock and update
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_name} not found")
        
        if not product['available']:
            raise HTTPException(status_code=400, detail=f"Product {item.product_name} is not available")
        
        if product['stock'] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.product_name}")
        
        # Update stock
        new_stock = product['stock'] - item.quantity
        update_data = {"stock": new_stock}
        
        # Auto set to unavailable if stock reaches 0
        if new_stock <= 0:
            update_data["available"] = False
        
        await db.products.update_one({"id": item.product_id}, {"$set": update_data})
    
    order = Order(**order_data.model_dump())
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    
    await db.orders.insert_one(order_doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(require_role([UserRole.MERCHANT, UserRole.ADMIN]))):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_update: OrderUpdateStatus,
    current_user: User = Depends(require_role([UserRole.MERCHANT, UserRole.ADMIN]))
):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status_update.status}})
    
    # TODO: Send email notification to customer
    # This will be implemented when Gmail credentials are provided
    
    return {"message": "Order status updated", "status": status_update.status}

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
