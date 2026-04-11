import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Trash2, ShoppingCart, CreditCard, ArrowLeft, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerId: string;
}

interface Props {
  onBack: () => void;
}

export default function Cart({ onBack }: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const cartQuery = query(
      collection(db, 'cart'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
      setCartItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'cart'));

    return () => unsubscribe();
  }, []);

  const removeFromCart = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cart', id));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (!auth.currentUser || cartItems.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const batch = writeBatch(db);
      
      // Create orders for each item
      for (const item of cartItems) {
        const orderRef = doc(collection(db, 'orders'));
        batch.set(orderRef, {
          buyerId: auth.currentUser.uid,
          sellerId: item.sellerId,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        // Remove from cart
        const cartRef = doc(db, 'cart', item.id);
        batch.delete(cartRef);
      }
      
      await batch.commit();
      toast.success('Payment successful! Your orders have been placed.');
      onBack();
    } catch (error) {
      console.error(error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground text-lg">Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="flex items-center p-4 gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img 
                      src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/200/200`} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <p className="text-indigo-600 font-bold">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCheckout} 
                disabled={isCheckingOut}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Checkout Now
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <PackageCheck className="w-4 h-4" />
            <span>Secure Checkout • Dummy Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
