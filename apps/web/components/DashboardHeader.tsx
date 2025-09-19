'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, 
  User, 
  Settings, 
  Home, 
  Smartphone, 
  Shield, 
  Menu,
  X,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fechar menus quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fechar menu mobile quando trocar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Dispositivos', href: '/devices', icon: Smartphone },
    { name: 'Políticas', href: '/policies', icon: Shield },
    { name: 'Pendentes', href: '/pending-devices', icon: Settings, badge: 0 },
  ];

  return (
    <header className="sticky top-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-xl border-b border-blue-800/50 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Brand */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  FRIAXIS
                </span>
                <span className="text-xs text-blue-300 font-medium -mt-1">
                  Gestão de Dispositivos
                </span>
              </div>
            </Link>
            
            {/* Navegação Desktop */}
            <nav className="hidden lg:flex space-x-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/20'
                        : 'text-blue-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Ações e Menu do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Busca Expansível (Desktop) */}
            <div className="hidden md:flex relative" ref={searchRef}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {searchOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 z-[60]">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar dispositivos..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notificações */}
            <button className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                3
              </span>
            </button>

            {/* Menu do Usuário */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-white">
                      {user?.email?.split('@')[0] || 'Admin'}
                    </div>
                    <div className="text-xs text-blue-300">
                      {user?.email || 'admin@coruzen.com'}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown do Usuário */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[60]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user?.email?.split('@')[0] || 'Administrador'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.email || 'admin@coruzen.com'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Perfil</span>
                  </button>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-blue-800/50">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/20'
                        : 'text-blue-100 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Busca Mobile */}
            <div className="mt-4 px-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-blue-300" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar dispositivos..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}