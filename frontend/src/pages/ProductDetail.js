import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/App';
import { toast } from 'sonner';

const ProductDetail = ({ auth }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Produit non trouvé');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        toast.error('Stock insuffisant');
        return;
      }
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Ajouté au panier');
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-8 gap-2"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-white">
            <img 
              src={`${process.env.REACT_APP_BACKEND_URL}${product.image_url}`}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid="product-detail-image"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900" data-testid="product-detail-name">
              {product.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed" data-testid="product-detail-description">
              {product.description}
            </p>

            <div className="mb-8">
              <span className="text-5xl font-bold text-blue-600" data-testid="product-detail-price">
                {product.price.toFixed(2)}€
              </span>
              <p className="text-gray-500 mt-2" data-testid="product-detail-stock">
                Stock disponible: {product.stock} unités
              </p>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-gray-700 font-medium">Quantité:</span>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  data-testid="decrease-quantity-btn"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center" data-testid="quantity-display">
                  {quantity}
                </span>
                <Button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={quantity >= product.stock}
                  data-testid="increase-quantity-btn"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={addToCart}
              className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg"
              disabled={!product.available || product.stock === 0}
              data-testid="add-to-cart-detail-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              {!product.available || product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
