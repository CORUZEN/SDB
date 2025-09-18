'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase-client';

interface AuthContextType {
  user: any; // User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser?: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn('⚠️ Firebase Auth não disponível - modo desenvolvimento');
      // Em desenvolvimento, simular usuário logado para teste
      if (process.env.NODE_ENV === 'development') {
        const mockUser = {
          uid: 'dev-user-123',
          email: 'dev@teste.com',
          displayName: 'Usuário de Desenvolvimento'
        };
        setUser(mockUser as any);
        console.log('🔧 Usuário de desenvolvimento criado:', mockUser.email);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Se usuário autenticado, apenas definir no estado
      if (user) {
        console.log(`✅ Usuário autenticado: ${user.email}`);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth não disponível');
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth não disponível');
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Log logout
      if (user) {
        console.log(`👋 Usuário fez logout: ${user.email}`);
      }
      
      // Limpar usuário de teste se existir
      
      if (!auth) {
        console.warn('Firebase Auth não disponível');
        setUser(null);
        return;
      }
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}