'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { 
  Shield, 
  ArrowLeft, 
  Edit3, 
  Trash2,
  Power,
  PowerOff,
  Check,
  X,
  Smartphone,
  Lock,
  Camera,
  Wifi,
  Eye,
  Clock,
  Users
} from 'lucide-react';
import { policiesApi, devicesApi, type Policy } from '../../../lib/api-service';

interface PolicyPageProps {
  params: {
    id: string;
  };
}

export default function PolicyDetailsPage({ params }: PolicyPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [devicesCount, setDevicesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicyDetails();
  }, [params.id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPolicyDetails = async () => {
    setLoading(true);
    try {
      const [policyData, devices] = await Promise.all([
        policiesApi.getById(params.id),
        devicesApi.getAll() // Para contar quantos dispositivos têm essa política
      ]);
      
      setPolicy(policyData);
      
      // Contar dispositivos que usam esta política (se tivéssemos essa informação)
      // Por enquanto, vamos deixar como 0 ou implementar a lógica depois
      setDevicesCount(0);
    } catch (error) {
      console.error('Erro ao carregar política:', error);
      router.push('/policies');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!policy) return;
    
    try {
      await policiesApi.update(policy.id, { is_active: !policy.is_active });
      setPolicy(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (error) {
      console.error('Erro ao alterar status da política:', error);
      alert('Erro ao alterar status da política');
    }
  };

  const handleDeletePolicy = async () => {
    if (!policy) return;
    
    if (!confirm(`Tem certeza que deseja excluir a política "${policy.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await policiesApi.delete(policy.id);
      router.push('/policies');
    } catch (error) {
      console.error('Erro ao excluir política:', error);
      alert('Erro ao excluir política');
    }
  };

  const renderConfigItem = (label: string, value: boolean, icon: React.ReactNode) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        {icon}
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center">
        {value ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <X className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100">
          <DashboardHeader />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando política...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!policy) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100">
          <DashboardHeader />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Política não encontrada
              </h3>
              <Link
                href="/policies"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Políticas
              </Link>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex flex-col">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Link 
                    href="/policies"
                    className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                      <Shield className="w-8 h-8 mr-3 text-blue-600" />
                      {policy.name}
                    </h1>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        policy.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {policy.is_active ? (
                          <>
                            <Power className="w-4 h-4 mr-1" />
                            Ativa
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-4 h-4 mr-1" />
                            Inativa
                          </>
                        )}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Criada em {new Date(policy.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {devicesCount} dispositivos
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleActive}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                      policy.is_active
                        ? 'text-red-700 bg-red-100 hover:bg-red-200'
                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    {policy.is_active ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </button>
                  <Link
                    href={`/policies/${policy.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                  <button
                    onClick={handleDeletePolicy}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {policy.description && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700">{policy.description}</p>
              </div>
            )}

            {/* Configurações de Segurança */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configurações de Segurança
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Controles Principais</h4>
                  <div className="space-y-1">
                    {renderConfigItem(
                      'Modo Kiosque',
                      policy.policy_json.kiosk_mode || false,
                      <Smartphone className="w-4 h-4 text-gray-600" />
                    )}
                    {renderConfigItem(
                      'PIN Obrigatório',
                      policy.policy_json.require_pin || false,
                      <Lock className="w-4 h-4 text-gray-600" />
                    )}
                    {renderConfigItem(
                      'Criptografia Obrigatória',
                      policy.policy_json.force_encrypt || false,
                      <Shield className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Controles de Hardware</h4>
                  <div className="space-y-1">
                    {renderConfigItem(
                      'Câmera Desabilitada',
                      policy.policy_json.disable_camera || false,
                      <Camera className="w-4 h-4 text-gray-600" />
                    )}
                    {renderConfigItem(
                      'Bluetooth Desabilitado',
                      policy.policy_json.disable_bluetooth || false,
                      <Smartphone className="w-4 h-4 text-gray-600" />
                    )}
                    {renderConfigItem(
                      'Wi-Fi Desabilitado',
                      policy.policy_json.disable_wifi || false,
                      <Wifi className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Configurações de PIN */}
              {policy.policy_json.require_pin && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Configurações de PIN</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tamanho:</span>
                      <span className="ml-2 font-medium">{policy.policy_json.pin_length || 4} dígitos</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Máx. tentativas:</span>
                      <span className="ml-2 font-medium">{policy.policy_json.max_failed_attempts || 3}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeout da Tela */}
              {policy.policy_json.screen_timeout && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Configurações de Tela</h4>
                  <div className="text-sm">
                    <span className="text-gray-600">Timeout:</span>
                    <span className="ml-2 font-medium">{policy.policy_json.screen_timeout} segundos</span>
                  </div>
                </div>
              )}
            </div>

            {/* Apps Permitidos */}
            {policy.policy_json.launcher_apps && policy.policy_json.launcher_apps.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Apps Permitidos ({policy.policy_json.launcher_apps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {policy.policy_json.launcher_apps.map((app, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded px-3 py-2">
                      <span className="text-sm text-green-800 font-mono">{app}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apps Bloqueados */}
            {policy.policy_json.blocked_apps && policy.policy_json.blocked_apps.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Apps Bloqueados ({policy.policy_json.blocked_apps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {policy.policy_json.blocked_apps.map((app, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span className="text-sm text-red-800 font-mono">{app}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}