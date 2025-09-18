import Link from 'next/link';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SDB</h1>
              <span className="ml-2 text-sm text-gray-500">Sistema de Bloqueio</span>
            </div>
            <nav className="flex space-x-4">
              <a href="/devices" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dispositivos
              </a>
              <a href="/policies" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Políticas
              </a>
              <a href="/events" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Eventos
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              {/* API Status */}
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">APIs</h3>
                    <p className="text-sm text-gray-600">Funcionando</p>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Banco</h3>
                    <p className="text-sm text-gray-600">Conectado</p>
                  </div>
                </div>
              </div>

              {/* Firebase Status */}
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Firebase</h3>
                    <p className="text-sm text-gray-600">Configurado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Status */}
            <div className="card mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status do Desenvolvimento</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span className="text-sm">F0-F1: Fundação e APIs básicas</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-400 mr-3" />
                  <span className="text-sm">F2: Frontend e localização (em progresso)</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">F3: Launcher Android</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">F4: Ações remotas</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">F5: Screenshots assistidas</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-4">
                <a href="/devices" className="btn-primary">
                  Ver Dispositivos
                </a>
                <a href="/api/health" className="btn-secondary">
                  Health Check
                </a>
                <a href="/api/devices" className="btn-secondary">
                  API Devices
                </a>
                <a href="/api/dbtest" className="btn-secondary">
                  Teste DB
                </a>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900">Próximos Passos:</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Implementar autenticação Firebase</li>
                <li>• Criar páginas de gestão de dispositivos</li>
                <li>• Adicionar mapa de localização</li>
                <li>• Configurar FCM para comandos remotos</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}