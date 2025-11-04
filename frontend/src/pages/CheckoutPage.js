import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API } from '@/App';
import { toast } from 'sonner';

const CheckoutPage = ({ auth }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart || JSON.parse(savedCart).length === 0) {
      navigate('/cart');
    } else {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customer: formData,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };

      await axios.post(`${API}/orders`, orderData);
      localStorage.removeItem('cart');
      setOrderPlaced(true);
      toast.success('Commande passée avec succès!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md" data-testid="order-success">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Commande confirmée!</h1>
          <p className="text-gray-600 mb-8">
            Merci pour votre commande. Vous recevrez un email de confirmation sous peu.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-blue-600 to-green-600"
            data-testid="back-home-btn"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button 
          onClick={() => navigate('/cart')} 
          variant="ghost" 
          className="mb-8 gap-2"
          data-testid="back-to-cart-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-gray-900" data-testid="checkout-title">Finaliser la commande</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="checkout-form">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  data-testid="checkout-name-input"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                  data-testid="checkout-email-input"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                  data-testid="checkout-phone-input"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse de livraison *</Label>
                <Textarea
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1"
                  rows={4}
                  data-testid="checkout-address-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                data-testid="place-order-btn"
              >
                {loading ? 'Traitement...' : 'Confirmer la commande'}
              </Button>
            </form>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Récapitulatif</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between" data-testid={`checkout-item-${item.id}`}>
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold">Total</span>
                  <span className="text-3xl font-bold text-blue-600" data-testid="checkout-total">
                    {total.toFixed(2)}€
                  </span>
                </div>
                <p className="text-sm text-gray-500" data-testid="payment-method">
                  Paiement à la livraison
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
