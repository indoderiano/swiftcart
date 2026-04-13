/**
 * App.tsx
 * The main entry point of the SwiftCart application.
 * This component handles the high-level routing and authentication state.
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Auth from './components/Auth';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import Navbar from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';

export default function App() {
  // State to store the Firebase Auth user object (contains email, uid, etc.)
  const [user, setUser] = useState<User | null>(null);
  
  // State to store the user's custom profile from Firestore (contains role, etc.)
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Loading state to prevent showing the login screen while checking auth status
  const [loading, setLoading] = useState(true);

  /**
   * useEffect Hook
   * Runs once when the component mounts.
   * It sets up a listener for authentication state changes.
   */
  useEffect(() => {
    // onAuthStateChanged is a Firebase listener that triggers whenever a user logs in or out
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        /**
         * Real-time Profile Listener
         * If a user is logged in, we listen to their document in the 'users' collection.
         * Using onSnapshot ensures that if the user's role changes (e.g., they switch from Buyer to Seller),
         * the UI updates immediately without a refresh.
         */
        const unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          }
          setLoading(false);
        });
        
        // Return the cleanup function for the profile listener
        return () => unsubscribeProfile();
      } else {
        // No user logged in
        setUserProfile(null);
        setLoading(false);
      }
    });

    // Return the cleanup function for the auth listener
    return () => unsubscribeAuth();
  }, []);

  // Show a loading spinner while we determine the user's authentication status
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
    // ErrorBoundary catches any unexpected crashes in child components
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50/50">
        {!user ? (
          // If no user is logged in, show the Authentication (Login) screen
          <Auth />
        ) : (
          // If logged in, show the main app layout
          <>
            <Navbar user={user} userProfile={userProfile} />
            <main className="py-8">
              {/* 
                  Role-Based Routing:
                  We decide which dashboard to show based on the 'role' field in the user's profile.
              */}
              {userProfile?.role === 'seller' ? (
                <SellerDashboard />
              ) : (
                <BuyerDashboard />
              )}
            </main>
          </>
        )}
        {/* Toaster provides the popup notifications (success/error messages) */}
        <Toaster position="top-center" />
      </div>
    </ErrorBoundary>
  );
}

