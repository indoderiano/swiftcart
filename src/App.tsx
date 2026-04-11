/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import Auth from './components/Auth';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import Navbar from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Listen to user profile changes
        const unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          }
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading SwiftCart...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50/50">
        {!user ? (
          <Auth />
        ) : (
          <>
            <Navbar user={user} userProfile={userProfile} />
            <main className="py-8">
              {userProfile?.role === 'seller' ? (
                <SellerDashboard />
              ) : (
                <BuyerDashboard />
              )}
            </main>
          </>
        )}
        <Toaster position="top-center" />
      </div>
    </ErrorBoundary>
  );
}

