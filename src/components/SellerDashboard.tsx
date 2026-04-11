import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Plus, Package, ShoppingCart, Trash2, CheckCircle, Clock, Truck, Database } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const SAMPLE_PRODUCTS = [
  { name: 'Quantum Pro Headphones', description: 'Experience studio-quality sound with active noise cancellation and 40-hour battery life.', price: 299.99, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
  { name: 'Minimalist Desk Lamp', description: 'Sleek, touch-controlled LED lamp with adjustable brightness and color temperature.', price: 45.50, imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&q=80' },
  { name: 'Organic Cotton Hoodie', description: 'Ultra-soft, sustainably sourced cotton hoodie. Perfect for everyday comfort.', price: 65.00, imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80' },
  { name: 'Smart Fitness Tracker', description: 'Track your steps, heart rate, and sleep with this waterproof, long-lasting wearable.', price: 89.99, imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80' },
  { name: 'Artisan Coffee Beans', description: 'Single-origin Arabica beans, medium roast with notes of chocolate and hazelnut.', price: 18.00, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80' },
  { name: 'Ergonomic Mouse', description: 'Reduce wrist strain with this vertical ergonomic mouse. Wireless with 6 buttons.', price: 34.99, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80' },
  { name: 'Portable Bluetooth Speaker', description: 'Compact yet powerful speaker with 360-degree sound and IPX7 waterproof rating.', price: 55.00, imageUrl: 'https://images.unsplash.com/photo-1608351489262-80451135c67e?w=800&q=80' },
  { name: 'Leather Travel Journal', description: 'Handcrafted genuine leather journal with refillable cream-colored pages.', price: 28.50, imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80' }
];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerId: string;
  imageUrl: string;
  createdAt: any;
}

interface Order {
  id: string;
  buyerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: any;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', auth.currentUser.uid)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const ordersQuery = query(
      collection(db, 'orders'),
      where('sellerId', '==', auth.currentUser.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.displayName,
        createdAt: serverTimestamp()
      });
      toast.success('Product added successfully!');
      setIsAddingProduct(false);
      setNewProduct({ name: '', description: '', price: '', imageUrl: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product.');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order marked as ${status}.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update order status.');
    }
  };

  const handleSeedData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const promises = SAMPLE_PRODUCTS.map(product => 
        addDoc(collection(db, 'products'), {
          ...product,
          sellerId: auth.currentUser!.uid,
          sellerName: auth.currentUser!.displayName,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
      toast.success(`Successfully added ${SAMPLE_PRODUCTS.length} sample products!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to seed sample data.');
    } finally {
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and track your sales.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSeedData} 
            disabled={loading}
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Database className="w-4 h-4 mr-2" />
            Seed Sample Data
          </Button>
          <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the details for your new listing.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newProduct.description} 
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    value={newProduct.price} 
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input 
                    id="image" 
                    value={newProduct.imageUrl} 
                    onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-indigo-600">Create Listing</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            My Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sales Orders
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {products.map(product => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="overflow-hidden group">
                    <div className="aspect-video relative bg-gray-100 overflow-hidden">
                      <img 
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/225`} 
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <span className="font-bold text-indigo-600">${product.price.toFixed(2)}</span>
                      </div>
                      <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="bg-gray-50/50 border-t flex justify-end p-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No products yet</h3>
                <p className="text-muted-foreground">Start selling by adding your first product.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="flex flex-col md:flex-row items-center p-4 gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingCart className="text-indigo-600 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{order.productName}</h4>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order ID: {order.id.slice(0, 8)} • Quantity: {order.quantity} • Total: ${order.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped')}>
                      <Truck className="w-4 h-4 mr-2" />
                      Ship Order
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {orders.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed rounded-xl">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-muted-foreground">Your sales will appear here once customers start buying.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
