import React from 'react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { ShoppingBag, LogOut, User, Store, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface Props {
  user: any;
  userProfile: any;
}

export default function Navbar({ user, userProfile }: Props) {
  const switchRole = async () => {
    if (!user) return;
    const newRole = userProfile?.role === 'seller' ? 'buyer' : 'seller';
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      toast.success(`Switched to ${newRole} mode!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to switch role.');
    }
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              SwiftCart
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={switchRole}
                  className="hidden sm:flex items-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Switch to {userProfile?.role === 'seller' ? 'Buyer' : 'Seller'}
                </Button>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium">{user.displayName}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase">
                    {userProfile?.role || 'User'}
                  </Badge>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => signOut(auth)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
