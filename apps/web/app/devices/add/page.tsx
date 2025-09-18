'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '../../../components/DashboardHeader';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { 
  ArrowLeft, 
  Save, 
  Smartphone, 
  User, 
  Tag, 
  Info,
  AlertCircle 
} from 'lucide-react';

export default function AddDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const deviceData = {
        name: formData.name,
        owner: formData.owner || null,
        tags: tagsArray,
        status: 'offline' as const
      };

      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar dispositivo');
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <ProtectedRoute>
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex flex-col">
        <DashboardHeader />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 mb-4 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 mr-4 shadow-lg">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Adicionar Dispositivo
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Cadastre um novo dispositivo no sistema
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {success && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Dispositivo criado com sucesso! Redirecionando...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      <Smartphone className="inline h-4 w-4 mr-1" />
                      Nome do Dispositivo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: Smartphone João"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Proprietário
                    </label>
                    <input
                      type="text"
                      id="owner"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: joão.silva@empresa.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: principal, trabalho, pessoal"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Informações importantes:</p>
                        <ul className="space-y-1 text-blue-600">
                          <li>• O dispositivo será criado com status &quot;offline&quot;</li>
                          <li>• Para ativá-lo, instale e configure o app SDB no dispositivo</li>
                          <li>• Tags ajudam na organização e filtros do dashboard</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.name}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Criar Dispositivo
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
