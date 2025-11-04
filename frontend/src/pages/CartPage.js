import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CartPage = ({ auth }) => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = cart.find(item => item.id === productId);
    if (newQuantity > product.stock) {
      toast.error('Stock insuffisant');
      return;
    }
    
    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: Math.max(0, newQuantity) } : item
    ).filter(item => item.quantity > 0);
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    toast.success('Article retiré du panier');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-8 gap-2"
          data-testid="back-to-shop-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Continuer mes achats
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-gray-900" data-testid="cart-title">Mon Panier</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-cart">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <p className="text-gray-500 text-xl mb-6">Votre panier est vide</p>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-gradient-to-r from-blue-600 to-green-600"
              data-testid="start-shopping-btn"
            >
              Commencer mes achats
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex gap-6"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${item.image_url}`}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover"
                    data-testid={`cart-item-image-${item.id}`}
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2" data-testid={`cart-item-name-${item.id}`}>
                      {item.name}
                    </h3>
                    <p className="text-gray-600 mb-4" data-testid={`cart-item-price-${item.id}`}>
                      {item.price.toFixed(2)}€
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        data-testid={`decrease-cart-quantity-${item.id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-medium w-12 text-center" data-testid={`cart-item-quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        data-testid={`increase-cart-quantity-${item.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`remove-cart-item-${item.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <span className="text-2xl font-bold text-blue-600" data-testid={`cart-item-total-${item.id}`}>
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-semibold text-gray-700">Total</span>
                <span className="text-4xl font-bold text-blue-600" data-testid="cart-total">
                  {total.toFixed(2)}€
                </span>
              </div>
              
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg"
                data-testid="proceed-checkout-btn"
              >
                Passer la commande
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
