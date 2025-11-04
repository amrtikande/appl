import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API } from '@/App';
import { toast } from 'sonner';

const HomePage = ({ auth }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data.filter(p => p.available));
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Stock insuffisant');
        return;
      }
      newCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success('Ajouté au panier');
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent" data-testid="home-logo">
              ShopModerne
            </Link>
            
            <div className="flex items-center gap-4">
              {auth.user ? (
                <>
                  {auth.user.role === 'admin' && (
                    <Button 
                      onClick={() => navigate('/admin')} 
                      variant="ghost" 
                      className="gap-2"
                      data-testid="admin-dashboard-btn"
                    >
                      <Settings className="w-4 h-4" />
                      Admin
                    </Button>
                  )}
                  {(auth.user.role === 'merchant' || auth.user.role === 'admin') && (
                    <Button 
                      onClick={() => navigate('/merchant')} 
                      variant="ghost" 
                      className="gap-2"
                      data-testid="merchant-dashboard-btn"
                    >
                      <Package className="w-4 h-4" />
                      Dashboard
                    </Button>
                  )}
                  <Button 
                    onClick={auth.logout} 
                    variant="ghost" 
                    className="gap-2"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="ghost" 
                  className="gap-2"
                  data-testid="login-btn"
                >
                  <User className="w-4 h-4" />
                  Connexion
                </Button>
              )}
              
              <Button 
                onClick={() => navigate('/cart')} 
                className="relative gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                data-testid="cart-btn"
              >
                <ShoppingCart className="w-4 h-4" />
                Panier
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500" data-testid="cart-count">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent fade-in" data-testid="hero-title">
            Bienvenue sur ShopModerne
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto fade-in" data-testid="hero-subtitle">
            Découvrez notre collection de produits exceptionnels
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <div 
              key={product.id} 
              className="product-card bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
              data-testid={`product-card-${product.id}`}
            >
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${product.image_url}`} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    data-testid={`product-image-${product.id}`}
                  />
                </div>
              </Link>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`product-desc-${product.id}`}>
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600" data-testid={`product-price-${product.id}`}>
                    {product.price.toFixed(2)}€
                  </span>
                  <span className="text-sm text-gray-500" data-testid={`product-stock-${product.id}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                
                <Button 
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  disabled={product.stock === 0}
                  data-testid={`add-to-cart-btn-${product.id}`}
                >
                  {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-20" data-testid="no-products">
            <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucun produit disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
