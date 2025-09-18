// Firebase Admin SDK Configuration
// Para uso no servidor (API routes, middleware)

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Verificar se as variáveis do Firebase estão configuradas
const hasFirebaseConfig = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let firebaseAdmin: App | null = null;

if (hasFirebaseConfig) {
  // Configuração do Firebase Admin
  const firebaseAdminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID!,
  };

  // Inicializar Firebase Admin (singleton)
  firebaseAdmin = getApps().find(app => app.name === 'admin') || 
    initializeApp(firebaseAdminConfig, 'admin');
}

// Exportar serviços (podem ser null se não configurado)
export const adminAuth = firebaseAdmin ? getAuth(firebaseAdmin) : null;
export const adminMessaging = firebaseAdmin ? getMessaging(firebaseAdmin) : null;

// Função para verificar token de ID do cliente
export async function verifyIdToken(idToken: string) {
  if (!adminAuth) {
    return { success: false, error: 'Firebase Admin não configurado' };
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { success: true, decodedToken };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Token inválido' };
  }
}

// Função para enviar push notification via FCM
export async function sendPushNotification(fcmToken: string, data: Record<string, string>) {
  if (!adminMessaging) {
    return { success: false, error: 'Firebase Messaging não configurado' };
  }
  
  try {
    const message = {
      token: fcmToken,
      data,
      android: {
        priority: 'high' as const,
        ttl: 60000, // 1 minuto
      }
    };

    const response = await adminMessaging.send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro no FCM' };
  }
}

// Função para enviar push para múltiplos tokens
export async function sendMulticastNotification(tokens: string[], data: Record<string, string>) {
  if (!adminMessaging) {
    return { success: false, error: 'Firebase Messaging não configurado' };
  }
  
  try {
    const message = {
      tokens,
      data,
      android: {
        priority: 'high' as const,
        ttl: 60000,
      }
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses 
    };
  } catch (error) {
    console.error('Erro ao enviar push multicast:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro no FCM multicast' };
  }
}