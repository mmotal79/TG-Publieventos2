/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSales: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !user.email) return;

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/email/${user.email}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProfile({
              uid: user.uid,
              email: data.email,
              displayName: data.nombre,
              role: data.rol,
            });
          }
        } else {
          // Fallback if user not found in MongoDB
          if (isMounted) {
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 4, // Default role: Cliente
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile from MongoDB:", error);
        if (isMounted) {
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 4,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === UserRole.ADMIN,
    isManager: profile?.role === UserRole.ADMIN || profile?.role === UserRole.MANAGER,
    isSales: profile?.role === UserRole.SALES,
    isEmployee: profile?.role === UserRole.EMPLOYEE,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
