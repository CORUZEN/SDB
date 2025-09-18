'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '../../components/DashboardHeader';

interface PendingDevice {
  device_id: string;
  pairing_code: string;
  name: string;
  model: string;
  android_version: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function PendingDevicesPage() {
  const [pendingDevices, setPendingDevices] = useState<PendingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    fetchPendingDevices();
    
    // Auto-refresh a cada 5 segundos
    const interval = setInterval(fetchPendingDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchPendingDevices = async () => {
    try {
      const response = await fetch('/api/admin/pending-devices');
      const data = await response.json();
      
      if (data.success) {
        setPendingDevices(data.data);
        setNeedsSetup(false);
      } else {
        if (data.needsSetup) {
          setNeedsSetup(true);
          showMessage('error', data.error);
        } else {
          showMessage('error', data.error || 'Erro ao carregar dispositivos pendentes');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      showMessage('error', 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (pairingCode: string, action: 'approve' | 'reject') => {
    setProcessing(pairingCode);
    
    try {
      const response = await fetch('/api/admin/pending-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairing_code: pairingCode,
          action: action
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', data.message);
        fetchPendingDevices(); // Recarregar lista
      } else {
        showMessage('error', data.error || 'Erro ao processar ação');
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error);
      showMessage('error', 'Erro de conexão');
    } finally {
      setProcessing(null);
    }
  };

  const handleSetupDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate/device-registrations', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Banco de dados configurado com sucesso!');
        fetchPendingDevices(); // Recarregar lista
      } else {
        showMessage('error', data.error || 'Erro ao configurar banco de dados');
      }
    } catch (error) {
      console.error('Erro ao configurar banco:', error);
      showMessage('error', 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dispositivos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <DashboardHeader />
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {/* Mensagem de status */}
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Dispositivos Pendentes de Aprovação
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {pendingDevices.length} dispositivo(s) aguardando aprovação
              </p>
            </div>

            {pendingDevices.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 sm:py-12">
                <div className="text-center max-w-md">
                  <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📱</div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    Nenhum dispositivo pendente
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base px-4 mb-6">
                    Quando um novo dispositivo tentar se conectar, ele aparecerá aqui.
                  </p>
                  
                  {/* Botão para configurar banco se necessário */}
                  {needsSetup && (
                    <button
                      onClick={handleSetupDatabase}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Configurando...' : '⚙️ Configurar Banco de Dados'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modelo
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Android
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Solicitado em
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingDevices.map((device) => (
                        <tr key={device.pairing_code} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">
                              {device.pairing_code}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {device.name}
                            </div>
                            <div className="sm:hidden text-xs text-gray-500">
                              {device.model} • Android {device.android_version}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {device.model}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {device.android_version}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(device.created_at)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <button
                                onClick={() => handleAction(device.pairing_code, 'approve')}
                                disabled={processing === device.pairing_code}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md disabled:opacity-50 transition-colors text-xs sm:text-sm"
                              >
                                {processing === device.pairing_code ? 'Processando...' : '✅ Aprovar'}
                              </button>
                              <button
                                onClick={() => handleAction(device.pairing_code, 'reject')}
                                disabled={processing === device.pairing_code}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md disabled:opacity-50 transition-colors text-xs sm:text-sm"
                              >
                                {processing === device.pairing_code ? 'Processando...' : '❌ Rejeitar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}