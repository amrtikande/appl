import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, LogOut, Home, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { API } from '@/App';
import { toast } from 'sonner';

const AdminDashboard = ({ auth }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: null
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', parseFloat(newProduct.price));
    formData.append('stock', parseInt(newProduct.stock));
    formData.append('image', newProduct.image);

    try {
      await axios.post(`${API}/products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Produit ajouté avec succès');
      setShowAddDialog(false);
      setNewProduct({ name: '', description: '', price: '', stock: '', image: null });
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) return;
    
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="admin-dashboard-title">Dashboard Admin</h1>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/merchant')} variant="ghost" data-testid="admin-to-merchant-btn">
                Dashboard Commerçante
              </Button>
              <Button onClick={() => navigate('/')} variant="ghost" className="gap-2" data-testid="admin-home-btn">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
              <Button onClick={auth.logout} variant="ghost" className="gap-2" data-testid="admin-logout-btn">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Gestion des Produits</h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-green-600" data-testid="add-product-btn">
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau produit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4" data-testid="add-product-form">
                <div>
                  <Label htmlFor="name">Nom du produit</Label>
                  <Input
                    id="name"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    data-testid="product-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    data-testid="product-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      data-testid="product-price-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      required
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      data-testid="product-stock-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })}
                    data-testid="product-image-input"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-product-btn">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter le produit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100" data-testid={`admin-product-${product.id}`}>
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${product.image_url}`}
                alt={product.name}
                className="w-full h-48 object-cover"
                data-testid={`admin-product-image-${product.id}`}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2" data-testid={`admin-product-name-${product.id}`}>
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`admin-product-desc-${product.id}`}>
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600" data-testid={`admin-product-price-${product.id}`}>
                    {product.price.toFixed(2)}€
                  </span>
                  <span className="text-sm text-gray-500" data-testid={`admin-product-stock-${product.id}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <Button
                  onClick={() => handleDeleteProduct(product.id)}
                  variant="destructive"
                  className="w-full gap-2"
                  data-testid={`delete-product-${product.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Statistiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100" data-testid="stats-total-products">
              <p className="text-gray-600 mb-2">Total Produits</p>
              <p className="text-4xl font-bold text-blue-600">{products.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100" data-testid="stats-total-orders">
              <p className="text-gray-600 mb-2">Total Commandes</p>
              <p className="text-4xl font-bold text-green-600">{orders.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100" data-testid="stats-total-revenue">
              <p className="text-gray-600 mb-2">Revenu Total</p>
              <p className="text-4xl font-bold text-purple-600">
                {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
