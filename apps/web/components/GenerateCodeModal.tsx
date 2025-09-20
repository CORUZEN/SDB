'use client';

import { useState } from 'react';
import { X, Smartphone, Clock, Copy, CheckCircle, AlertCircle, Plus } from 'lucide-react';

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeGenerated: () => void;
}

interface GeneratedCode {
  pairing_code: string;
  device_id?: string;
  expires_at: string;
  created_at: string;
  duration_hours: number;
  description: string;
  message: string;
}

export const GenerateCodeModal = ({ isOpen, onClose, onCodeGenerated }: GenerateCodeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(1);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const authToken = localStorage.getItem('auth-token') || 'dev-token-mock';
      
      const response = await fetch('/api/admin/generate-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description || 'Código gerado pelo administrador',
          duration: duration
        })
      });
      
      const result = await response.json();
      console.log('📱 Resposta da API generate-code:', result);
      
      if (response.ok && result.success) {
        setGeneratedCode(result.data);
        onCodeGenerated(); // Atualizar a lista de dispositivos pendentes
      } else {
        setError(result.error || 'Erro ao gerar código');
      }
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      setError('Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode.pairing_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setDescription('');
    setDuration(1);
    setError('');
    setCopied(false);
    onClose();
  };

  const formatExpirationTime = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffInMinutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} horas`;
    return `${Math.floor(diffInMinutes / 1440)} dias`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gerar Código de Pareamento
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!generatedCode ? (
            /* Formulário de Geração */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Novo dispositivo sala 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ajuda a identificar o propósito do código
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração da Validade
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0.5}>30 minutos</option>
                  <option value={1}>1 hora</option>
                  <option value={2}>2 horas</option>
                  <option value={4}>4 horas</option>
                  <option value={8}>8 horas</option>
                  <option value={24}>24 horas</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Tempo que o código ficará válido para uso
                </p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Como usar o código:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Abra o app FRIAXIS no dispositivo Android</li>
                      <li>Digite o código de 6 dígitos gerado</li>
                      <li>Toque em &quot;Emparelhar Dispositivo&quot;</li>
                      <li>Aprove o dispositivo aqui no painel web</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gerando Código...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Gerar Código</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Código Gerado */
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Código Gerado com Sucesso!
                </h3>
                <p className="text-sm text-gray-600">
                  {generatedCode.message}
                </p>
              </div>

              {/* Código Principal */}
              <div className="bg-gray-900 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400 mb-2">Código de Pareamento</p>
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-4xl font-mono font-bold text-white tracking-wider">
                    {generatedCode.pairing_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={`p-2 rounded-lg transition-colors ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-400 mt-2">
                    Código copiado para a área de transferência!
                  </p>
                )}
              </div>

              {/* Detalhes */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Válido por:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatExpirationTime(generatedCode.expires_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expira em:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(generatedCode.expires_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID do Dispositivo:</span>
                  <span className="text-sm font-mono text-gray-700">
                    {generatedCode.device_id ? generatedCode.device_id.substring(0, 16) + '...' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">Importante:</p>
                    <p>O código será exibido na lista &quot;Dispositivos Pendentes&quot; assim que um dispositivo Android o utilizar. Você pode fechar esta janela com segurança.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setGeneratedCode(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Gerar Novo Código
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};