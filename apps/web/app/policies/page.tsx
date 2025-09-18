'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import ProtectedRoute from '../../components/ProtectedRoute';
import { DashboardHeader } from '../../components/DashboardHeader';
import { 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Power,
  PowerOff,
  Search,
  Filter
} from 'lucide-react';
import { policiesApi, type Policy } from '../../lib/api-service';

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadPolicies();
  }, [user, searchTerm, filterActive]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterActive !== null) filters.is_active = filterActive;
      
      const allPolicies = await policiesApi.getAll(filters);
      setPolicies(allPolicies);
    } catch (error) {
      console.error('Erro ao carregar políticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (policyId: string, currentStatus: boolean) => {
    try {
      await policiesApi.update(policyId, { is_active: !currentStatus });
      loadPolicies(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao alterar status da política:', error);
      alert('Erro ao alterar status da política');
    }
  };

  const handleDeletePolicy = async (policyId: string, policyName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a política "${policyName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await policiesApi.delete(policyId);
      loadPolicies(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir política:', error);
      alert('Erro ao excluir política');
    }
  };

  const getConfigSummary = (policyJson: any) => {
    const configs = [];
    if (policyJson.kiosk_mode) configs.push('Modo Kiosque');
    if (policyJson.require_pin) configs.push('PIN Obrigatório');
    if (policyJson.force_encrypt) configs.push('Criptografia');
    if (policyJson.disable_camera) configs.push('Câmera Bloqueada');
    if (policyJson.launcher_apps?.length > 0) configs.push(`${policyJson.launcher_apps.length} Apps Permitidos`);
    if (policyJson.blocked_apps?.length > 0) configs.push(`${policyJson.blocked_apps.length} Apps Bloqueados`);
    
    return configs.slice(0, 3).join(', ') + (configs.length > 3 ? '...' : '');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="w-full h-full bg-gray-100 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando políticas...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full h-full bg-gray-100 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 w-full">
          <div className="h-full">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                    <Shield className="w-6 sm:w-8 h-6 sm:h-8 mr-3 text-blue-600" />
                    Políticas de Segurança
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-gray-600">
                    Gerencie políticas de segurança para seus dispositivos
                  </p>
                </div>
                <Link
                  href="/policies/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Política
                </Link>
              </div>
            </div>

            {/* Filtros */}
            <div className="mb-4 sm:mb-6 bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar políticas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterActive(filterActive === true ? null : true)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border ${
                      filterActive === true
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Ativas
                  </button>
                  <button
                    onClick={() => setFilterActive(filterActive === false ? null : false)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border ${
                      filterActive === false
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Inativas
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Políticas */}
            {policies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma política encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie sua primeira política de segurança para os dispositivos
                </p>
                <Link
                  href="/policies/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Política
                </Link>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Política
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Configurações
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Criada em
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {policies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {policy.name}
                              </div>
                              {policy.description && (
                                <div className="text-sm text-gray-500">
                                  {policy.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {getConfigSummary(policy.policy_json)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              policy.is_active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {policy.is_active ? (
                                <>
                                  <Power className="w-3 h-3 mr-1" />
                                  Ativa
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-3 h-3 mr-1" />
                                  Inativa
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(policy.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/policies/${policy.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/policies/${policy.id}/edit`}
                                className="text-green-600 hover:text-green-900"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleToggleActive(policy.id, policy.is_active)}
                                className={`${
                                  policy.is_active 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={policy.is_active ? 'Desativar' : 'Ativar'}
                              >
                                {policy.is_active ? (
                                  <PowerOff className="w-4 h-4" />
                                ) : (
                                  <Power className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(policy.id, policy.name)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </main>
      </div>
    </ProtectedRoute>
  );
}