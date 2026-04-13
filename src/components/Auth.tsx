/**
 * Auth.tsx
 * Handles user authentication (Login/Sign-up) using Google.
 * It also manages the initial role selection (Buyer vs. Seller).
 */

import React, { useState } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ShoppingBag, Store, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  // Local state to track which role the user has selected on the login screen
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  
  // Loading state for the sign-in button
  const [loading, setLoading] = useState(false);

  /**
   * handleLogin
   * Triggered when the user clicks the "Sign in with Google" button.
   */
  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Open the Google Sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Check if this user already has a profile in our Firestore 'users' collection
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 3a. New User: Create their profile document with the selected role
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: role,
          createdAt: serverTimestamp() // Uses the server's time for consistency
        });
        toast.success(`Welcome to SwiftCart as a ${role}!`);
      } else {
        // 3b. Existing User: Check if they want to switch roles
        const currentData = userDoc.data();
        if (currentData.role !== role) {
          // If the selected role is different from their saved role, update it
          // { merge: true } ensures we only update the specified fields and keep the rest
          await setDoc(userDocRef, { ...currentData, role: role }, { merge: true });
          toast.success(`Switched to ${role} mode!`);
        } else {
          toast.success(`Welcome back, ${user.displayName}!`);
        }
      }
    } catch (error: any) {
      // Handle common Firebase Auth errors gracefully
      console.error('Sign-in error details:', error);
      let message = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase. Please add it to the Authorized Domains in Firebase Console.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Sign-in popup was blocked. Please allow popups or open the app in a new tab.';
      } else if (error.message) {
        message = `Error: ${error.message}`;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-white">
      <Card className="max-w-md w-full shadow-xl border-t-4 border-t-indigo-600">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="text-indigo-600 w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">SwiftCart</CardTitle>
          <CardDescription>Your all-in-one e-commerce destination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Selection UI */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">I want to...</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Buyer Option */}
              <button
                onClick={() => setRole('buyer')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  role === 'buyer' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <ShoppingBag className="w-8 h-8 mb-2" />
                <span className="font-medium">Buy Products</span>
              </button>
              {/* Seller Option */}
              <button
                onClick={() => setRole('seller')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  role === 'seller' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <Store className="w-8 h-8 mb-2" />
                <span className="font-medium">Sell Products</span>
              </button>
            </div>
          </div>

          {/* Sign-in Button */}
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </span>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
