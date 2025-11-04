import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, LogOut, Home, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { API } from '@/App';
import { toast } from 'sonner';

const MerchantDashboard = ({ auth }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status });
      toast.success('Statut de commande mis à jour');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      await axios.patch(`${API}/products/${productId}`, updates);
      toast.success('Produit mis à jour');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      refused: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="merchant-dashboard-title">Dashboard Commerçante</h1>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" className="gap-2" data-testid="merchant-home-btn">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
              <Button onClick={auth.logout} variant="ghost" className="gap-2" data-testid="merchant-logout-btn">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="orders" className="gap-2" data-testid="orders-tab">
              <ShoppingBag className="w-4 h-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2" data-testid="products-tab">
              <Package className="w-4 h-4" />
              Produits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100" data-testid={`order-card-${order.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2" data-testid={`order-customer-${order.id}`}>
                        {order.customer.name}
                      </h3>
                      <p className="text-gray-600 text-sm" data-testid={`order-email-${order.id}`}>Email: {order.customer.email}</p>
                      <p className="text-gray-600 text-sm" data-testid={`order-phone-${order.id}`}>Tél: {order.customer.phone}</p>
                      <p className="text-gray-600 text-sm" data-testid={`order-address-${order.id}`}>Adresse: {order.customer.address}</p>
                    </div>
                    <Badge className={getStatusBadge(order.status)} data-testid={`order-status-${order.id}`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Articles:</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1" data-testid={`order-item-${order.id}-${idx}`}>
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>{(item.price * item.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-xl font-bold text-blue-600" data-testid={`order-total-${order.id}`}>
                      Total: {order.total.toFixed(2)}€
                    </span>
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'accepted')}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                          data-testid={`accept-order-${order.id}`}
                        >
                          <Check className="w-4 h-4" />
                          Accepter
                        </Button>
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'refused')}
                          variant="destructive"
                          className="gap-2"
                          data-testid={`refuse-order-${order.id}`}
                        >
                          <X className="w-4 h-4" />
                          Refuser
                        </Button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="gap-2"
                        data-testid={`complete-order-${order.id}`}
                      >
                        Marquer comme complété
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-20" data-testid="no-orders">
                  <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Aucune commande pour le moment</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100" data-testid={`product-card-${product.id}`}>
                  <div className="flex gap-6">
                    <img 
                      src={`${process.env.REACT_APP_BACKEND_URL}${product.image_url}`}
                      alt={product.name}
                      className="w-32 h-32 rounded-xl object-cover"
                      data-testid={`product-mgmt-image-${product.id}`}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2" data-testid={`product-mgmt-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-4" data-testid={`product-mgmt-price-${product.id}`}>
                        {product.price.toFixed(2)}€
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label htmlFor={`stock-${product.id}`}>Stock:</Label>
                          <Input
                            id={`stock-${product.id}`}
                            type="number"
                            value={product.stock}
                            onChange={(e) => updateProduct(product.id, { stock: parseInt(e.target.value) })}
                            className="w-24"
                            data-testid={`product-stock-input-${product.id}`}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Label htmlFor={`available-${product.id}`}>Disponible:</Label>
                          <Switch
                            id={`available-${product.id}`}
                            checked={product.available}
                            onCheckedChange={(checked) => updateProduct(product.id, { available: checked })}
                            data-testid={`product-available-switch-${product.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-20" data-testid="no-products-merchant">
                  <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Aucun produit disponible</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MerchantDashboard;
