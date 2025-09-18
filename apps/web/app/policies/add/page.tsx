'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { DashboardHeader } from '../../../components/DashboardHeader';
import { 
  Shield, 
  ArrowLeft, 
  Save,
  Plus,
  Minus,
  Smartphone,
  Lock,
  Camera,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';
import { policiesApi } from '../../../lib/api-service';

interface PolicyConfig {
  kiosk_mode: boolean;
  require_pin: boolean;
  pin_length?: number;
  force_encrypt: boolean;
  disable_camera: boolean;
  disable_bluetooth: boolean;
  disable_wifi: boolean;
  launcher_apps: string[];
  blocked_apps: string[];
  max_failed_attempts?: number;
  screen_timeout?: number;
}

export default function AddPolicyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const [config, setConfig] = useState<PolicyConfig>({
    kiosk_mode: false,
    require_pin: false,
    pin_length: 4,
    force_encrypt: false,
    disable_camera: false,
    disable_bluetooth: false,
    disable_wifi: false,
    launcher_apps: [],
    blocked_apps: [],
    max_failed_attempts: 3,
    screen_timeout: 30
  });

  const [newApp, setNewApp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor, digite o nome da política');
      return;
    }

    setLoading(true);
    try {
      // Limpar configurações opcionais quando desabilitadas
      const cleanConfig = { ...config };
      if (!config.require_pin) {
        delete cleanConfig.pin_length;
        delete cleanConfig.max_failed_attempts;
      }

      await policiesApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        policy_json: cleanConfig,
        is_active: formData.is_active
      });

      router.push('/policies');
    } catch (error) {
      console.error('Erro ao criar política:', error);
      alert('Erro ao criar política. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addLauncherApp = () => {
    if (newApp.trim() && !config.launcher_apps.includes(newApp.trim())) {
      setConfig(prev => ({
        ...prev,
        launcher_apps: [...prev.launcher_apps, newApp.trim()]
      }));
      setNewApp('');
    }
  };

  const removeLauncherApp = (app: string) => {
    setConfig(prev => ({
      ...prev,
      launcher_apps: prev.launcher_apps.filter(a => a !== app)
    }));
  };

  const addBlockedApp = () => {
    if (newApp.trim() && !config.blocked_apps.includes(newApp.trim())) {
      setConfig(prev => ({
        ...prev,
        blocked_apps: [...prev.blocked_apps, newApp.trim()]
      }));
      setNewApp('');
    }
  };

  const removeBlockedApp = (app: string) => {
    setConfig(prev => ({
      ...prev,
      blocked_apps: prev.blocked_apps.filter(a => a !== app)
    }));
  };

  return (
    <ProtectedRoute>
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex flex-col">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
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
                    Nova Política de Segurança
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Configure as regras de segurança para os dispositivos
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome da Política *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Política Corporativa Básica"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva o propósito desta política..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Política ativa (pode ser aplicada aos dispositivos)
                    </label>
                  </div>
                </div>
              </div>

              {/* Configurações de Segurança */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Configurações de Segurança
                </h3>

                <div className="space-y-4">
                  {/* Modo Kiosque */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="kiosk_mode"
                        checked={config.kiosk_mode}
                        onChange={(e) => setConfig(prev => ({ ...prev, kiosk_mode: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="kiosk_mode" className="text-sm font-medium text-gray-700">
                        Modo Kiosque
                      </label>
                      <p className="text-sm text-gray-500">
                        Restringe o dispositivo a apps específicos, removendo acesso a configurações
                      </p>
                    </div>
                  </div>

                  {/* PIN Obrigatório */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="require_pin"
                        checked={config.require_pin}
                        onChange={(e) => setConfig(prev => ({ ...prev, require_pin: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="require_pin" className="text-sm font-medium text-gray-700">
                        PIN Obrigatório
                      </label>
                      <p className="text-sm text-gray-500">
                        Força o usuário a configurar um PIN para desbloqueio
                      </p>
                      {config.require_pin && (
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600">Tamanho do PIN</label>
                            <select
                              value={config.pin_length}
                              onChange={(e) => setConfig(prev => ({ ...prev, pin_length: parseInt(e.target.value) }))}
                              className="mt-1 block w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value={4}>4 dígitos</option>
                              <option value={6}>6 dígitos</option>
                              <option value={8}>8 dígitos</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Tentativas máximas</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={config.max_failed_attempts}
                              onChange={(e) => setConfig(prev => ({ ...prev, max_failed_attempts: parseInt(e.target.value) }))}
                              className="mt-1 block w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Criptografia */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="force_encrypt"
                        checked={config.force_encrypt}
                        onChange={(e) => setConfig(prev => ({ ...prev, force_encrypt: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="force_encrypt" className="text-sm font-medium text-gray-700">
                        Criptografia Obrigatória
                      </label>
                      <p className="text-sm text-gray-500">
                        Força a criptografia do armazenamento do dispositivo
                      </p>
                    </div>
                  </div>

                  {/* Controles de Hardware */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="disable_camera"
                          checked={config.disable_camera}
                          onChange={(e) => setConfig(prev => ({ ...prev, disable_camera: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="disable_camera" className="text-sm font-medium text-gray-700 flex items-center">
                          <Camera className="w-4 h-4 mr-1" />
                          Desabilitar Câmera
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="disable_bluetooth"
                          checked={config.disable_bluetooth}
                          onChange={(e) => setConfig(prev => ({ ...prev, disable_bluetooth: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="disable_bluetooth" className="text-sm font-medium text-gray-700 flex items-center">
                          <Smartphone className="w-4 h-4 mr-1" />
                          Desabilitar Bluetooth
                        </label>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="disable_wifi"
                          checked={config.disable_wifi}
                          onChange={(e) => setConfig(prev => ({ ...prev, disable_wifi: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="disable_wifi" className="text-sm font-medium text-gray-700 flex items-center">
                          <Wifi className="w-4 h-4 mr-1" />
                          Desabilitar Wi-Fi
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Configurações Avançadas
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showAdvanced ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Mostrar
                      </>
                    )}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-6">
                    {/* Timeout da Tela */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout da Tela (segundos)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={config.screen_timeout}
                        onChange={(e) => setConfig(prev => ({ ...prev, screen_timeout: parseInt(e.target.value) }))}
                        className="block w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Apps Permitidos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apps Permitidos (Modo Kiosque)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newApp}
                          onChange={(e) => setNewApp(e.target.value)}
                          placeholder="Nome do pacote (ex: com.empresa.app)"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLauncherApp())}
                        />
                        <button
                          type="button"
                          onClick={addLauncherApp}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {config.launcher_apps.map((app, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">{app}</span>
                            <button
                              type="button"
                              onClick={() => removeLauncherApp(app)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Apps Bloqueados */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apps Bloqueados
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newApp}
                          onChange={(e) => setNewApp(e.target.value)}
                          placeholder="Nome do pacote (ex: com.facebook.katana)"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBlockedApp())}
                        />
                        <button
                          type="button"
                          onClick={addBlockedApp}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {config.blocked_apps.map((app, index) => (
                          <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">{app}</span>
                            <button
                              type="button"
                              onClick={() => removeBlockedApp(app)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/policies"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Criar Política
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}