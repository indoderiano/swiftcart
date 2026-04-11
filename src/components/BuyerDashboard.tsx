import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ShoppingBag, Package, Search, Filter, ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import Cart from './Cart';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerId: string;
  sellerName: string;
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

export default function BuyerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'cart'>('dashboard');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    if (auth.currentUser) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('buyerId', '==', auth.currentUser.uid)
      );
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', auth.currentUser.uid)
      );
      const unsubscribeCart = onSnapshot(cartQuery, (snapshot) => {
        setCartCount(snapshot.docs.length);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'cart'));

      return () => {
        unsubscribeProducts();
        unsubscribeOrders();
        unsubscribeCart();
      };
    }

    return () => unsubscribeProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (!auth.currentUser) return;

    try {
      // Check if item already in cart
      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', auth.currentUser.uid),
        where('productId', '==', product.id)
      );
      const cartSnap = await getDocs(cartQuery);

      if (!cartSnap.empty) {
        toast.info('Item is already in your cart');
        return;
      }

      await addDoc(collection(db, 'cart'), {
        userId: auth.currentUser.uid,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl || '',
        sellerId: product.sellerId,
        createdAt: serverTimestamp()
      });
      toast.success(`Added ${product.name} to cart!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add to cart.');
    }
  };

  const handleBuy = async (product: Product) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'orders'), {
        buyerId: auth.currentUser.uid,
        sellerId: product.sellerId,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        totalPrice: product.price,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success(`Order placed for ${product.name}!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'cart') {
    return <Cart onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Discover and buy unique products from sellers.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="relative shrink-0"
            onClick={() => setView('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-indigo-600">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="browse">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="w-4 h-4 mr-2" />
            My Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-gray-100 overflow-hidden">
                      <img 
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`} 
                        alt={product.name}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                        <span className="font-bold text-indigo-600">${product.price.toFixed(2)}</span>
                      </div>
                      <CardDescription className="text-xs">Sold by {product.sellerName || 'Anonymous'}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                      <Button onClick={() => handleAddToCart(product)} variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button onClick={() => handleBuy(product)} className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(order => (
              <Card key={order.id} className="flex items-center p-4 gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="text-green-600 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{order.productName}</h4>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order ID: {order.id.slice(0, 8)} • Total: ${order.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  {order.status === 'delivered' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500 ml-auto" />
                  )}
                </div>
              </Card>
            ))}
            {orders.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-muted-foreground">Your purchases will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
