'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Chrome,
  KeyRound,
  UserCheck,
  Building2
} from 'lucide-react';
import Footer from './Footer';

export default function LoginForm() {
  const [email, setEmail] = useState('admin@coruzen.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      router.push('/');
    } catch (error: any) {
      setError('Email ou senha incorretos. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error: any) {
      setError('Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col relative">
      {/* Conteúdo Principal */}
      <div className="flex-1 flex min-h-0">
        {/* Lado esquerdo - Informações da empresa */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {[...Array(64)].map((_, i) => (
                <div key={i} className="border border-white/20"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FRIAXIS</h1>
                <p className="text-blue-100 text-sm">Gestão de Dispositivos</p>
              </div>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Plataforma Completa de
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Gerenciamento Mobile
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Controle total dos dispositivos da sua empresa com segurança enterprise 
              e interface intuitiva para administradores.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-300" />
              </div>
              <span className="text-blue-100">Monitoramento em tempo real</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-300" />
              </div>
              <span className="text-blue-100">Políticas de segurança avançadas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-300" />
              </div>
              <span className="text-blue-100">Localização e controle remoto</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-300" />
              </div>
              <span className="text-blue-100">Relatórios e analytics detalhados</span>
            </div>
          </div>

          {/* Company Info */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center space-x-3 text-blue-100">
              <Building2 className="w-5 h-5" />
              <span className="text-sm">
                Uma solução <strong className="text-white">CORUZEN</strong> para empresas modernas
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Lado direito - Formulário de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {/* Header Mobile */}
            <div className="lg:hidden text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-3">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">FRIAXIS</h1>
              <p className="text-sm text-gray-500">Gestão de Dispositivos</p>
            </div>

            {/* Card de Login */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-7">
              {/* Header do Card */}
              <div className="text-center mb-5 sm:mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
                <p className="text-sm sm:text-base text-gray-500">Faça login para acessar o painel administrativo</p>
              </div>

            {/* Alert de Erro */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg transition-all duration-300 ease-in-out">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Erro de autenticação</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Campo Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Endereço de E-mail
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="seu.email@empresa.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Senha
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    placeholder="Digite sua senha"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-600">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">ou faça login com</span>
                </div>
              </div>

              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-sm hover:shadow"
              >
                <Chrome className="w-5 h-5 text-gray-600" />
                <span>Continuar com Google</span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 sm:mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Ao fazer login, você concorda com nossos{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Termos de Uso
                </button>{' '}
                e{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>

            {/* Info adicional */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-sm text-gray-500">
                Precisa de ajuda?{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Entre em contato com suporte
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rodapé Profissional */}
      <Footer />
    </div>
  );
}