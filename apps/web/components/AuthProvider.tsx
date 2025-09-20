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
  organization: any; // Organization context
  userRole: string | null;
  permissions: string[];
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser?: (user: any) => void;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  organization: null,
  userRole: null,
  permissions: [],
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserContext: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Function to refresh user context from API
  const refreshUserContext = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      
      // Store token in localStorage for api-service.ts to use
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', token);
      }
      
      // Fetch user organization and role from API
      const response = await fetch('/api/organizations/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setUserRole(data.role);
        setPermissions(data.permissions || []);
        
        console.log('🏢 Organization context loaded:', data.organization?.name);
        console.log('👤 User role:', data.role);
      } else {
        console.warn('⚠️ Failed to load organization context');
      }
    } catch (error) {
      console.error('❌ Error loading user context:', error);
    }
  };

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
        
        // Set mock token for development
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', 'dev-token-mock');
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Se usuário autenticado, carregar contexto organizacional
      if (user) {
        console.log(`✅ Usuário autenticado: ${user.email}`);
        
        // Load organization context after authentication
        try {
          const token = await user.getIdToken();
          
          // Store token in localStorage for api-service.ts to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', token);
          }
          
          const response = await fetch('/api/organizations/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setOrganization(data.organization);
            setUserRole(data.role);
            setPermissions(data.permissions || []);
            
            console.log('🏢 Organization context loaded:', data.organization?.name);
          }
        } catch (error) {
          console.warn('⚠️ Failed to load organization context:', error);
          // Continue even if organization context fails
        }
      } else {
        // Clear organization context and token on logout
        setOrganization(null);
        setUserRole(null);
        setPermissions([]);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
        }
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
      
      // Clear auth token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
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
    organization,
    userRole,
    permissions,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    setUser,
    refreshUserContext,
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