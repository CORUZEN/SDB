// Cliente API com autenticação automática
// Adiciona token Firebase nas requisições quando disponível

import { auth } from './firebase-client';

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest(
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  // Preparar headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {})
  };

  // Adicionar token de autenticação se disponível e não for skipAuth
  if (!skipAuth && auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.warn('⚠️ Erro ao obter token Firebase:', error);
    }
  }

  // Fazer requisição
  return fetch(url, {
    ...fetchOptions,
    headers
  });
}

// Função helper para GET com parsing automático
export async function apiGet<T = any>(url: string, options?: ApiRequestOptions): Promise<{
  data: T | null;
  error: string | null;
  status: number;
}> {
  try {
    const response = await apiRequest(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        data: null,
        error: data.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      data: data.data || data,
      error: null,
      status: response.status
    };
  } catch (error) {
    console.error(`Erro na requisição GET ${url}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro de rede',
      status: 0
    };
  }
}

// Função helper para POST com parsing automático
export async function apiPost<T = any>(
  url: string, 
  body: any, 
  options?: ApiRequestOptions
): Promise<{
  data: T | null;
  error: string | null;
  status: number;
}> {
  try {
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        data: null,
        error: data.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      data: data.data || data,
      error: null,
      status: response.status
    };
  } catch (error) {
    console.error(`Erro na requisição POST ${url}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro de rede',
      status: 0
    };
  }
}