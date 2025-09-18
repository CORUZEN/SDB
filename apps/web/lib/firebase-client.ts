// Firebase Client SDK Configuration
// Para uso no cliente (browser, autenticação de usuários)

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Verificar se Firebase está configurado
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                              process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Configuração do Firebase Client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo',
};

// Inicializar Firebase App (singleton) apenas se configurado
let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  firebaseAuth = getAuth(firebaseApp);
  firebaseDb = getFirestore(firebaseApp);
} else {
  console.warn('⚠️ Firebase não configurado - usando modo de desenvolvimento');
}

// Exportar auth e db (com fallback para null se não configurado)
export const auth = firebaseAuth;
export const db = firebaseDb;

// Conectar aos emuladores em desenvolvimento (opcional)
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  if (firebaseAuth) {
    try {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
    } catch (error) {
      console.log('Firebase Auth Emulator já conectado');
    }
  }
  
  if (firebaseDb) {
    try {
      connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
    } catch (error) {
      console.log('Firestore Emulator já conectado');
    }
  }
}

export default firebaseApp;