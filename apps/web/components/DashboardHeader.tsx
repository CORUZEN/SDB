'use client';

import { useAuth } from './AuthProvider'
import { searchDevices, formatLastSeen, getStatusColor, getStatusName, type SearchableDevice } from '@/lib/device-utils';
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
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  WifiOff,
  Battery,
  UserX,
  Globe,
  Lock,
  Palette,
  Database,
  BarChart3,
  Activity,
  Calendar,
  MapPin,
  Eye,
  Download,
  Upload,
  Zap,
  Monitor,
  Plus,
  Edit3
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

interface SearchResult {
  id: string;
  type: 'device' | 'user' | 'policy';
  title: string;
  subtitle: string;
  status?: 'online' | 'offline' | 'idle' | 'inactive';
  icon: React.ComponentType<{ className?: string }>;
  device?: SearchableDevice;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface UserStats {
  devicesManaged: number;
  actionsToday: number;
  alertsResolved: number;
  uptime: string;
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'access';
}

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    devicesManaged: 0,
    actionsToday: 0,
    alertsResolved: 0,
    uptime: '99.9%'
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Fechar menus quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Controlar scroll da página quando modais estão abertos
  useEffect(() => {
    if (settingsOpen || profileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [settingsOpen, profileOpen]);

  // Fechar modais com tecla Escape
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        }
        if (profileOpen) {
          setProfileOpen(false);
        }
      }
    }

    if (settingsOpen || profileOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [settingsOpen, profileOpen]);

  // Fechar menus quando trocar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
    setAlertsOpen(false);
    setSettingsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Carregar dados simulados
  useEffect(() => {
    // Carregar alertas lidos do localStorage
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    
    // Simulação de alertas
    const alertsData = [
      {
        id: '1',
        type: 'warning' as const,
        title: 'Dispositivos Offline',
        message: '3 dispositivos estão offline há mais de 1 hora',
        timestamp: '2025-09-18T22:30:00Z',
        read: readAlerts.includes('1'),
        actionUrl: '/devices?filter=offline'
      },
      {
        id: '2',
        type: 'error' as const,
        title: 'Política Violada',
        message: 'Dispositivo "iPad Pro" violou política de localização',
        timestamp: '2025-09-18T21:15:00Z',
        read: readAlerts.includes('2'),
        actionUrl: '/policies'
      },
      {
        id: '3',
        type: 'info' as const,
        title: 'Atualização Disponível',
        message: 'Nova versão do sistema disponível v2.1.0',
        timestamp: '2025-09-18T20:00:00Z',
        read: readAlerts.includes('3')
      }
    ];
    
    setAlerts(alertsData);

    // Simulação de estatísticas do usuário
    setUserStats({
      devicesManaged: 47,
      actionsToday: 12,
      alertsResolved: 8,
      uptime: '99.9%'
    });

    // Simulação de atividade recente
    setRecentActivity([
      {
        id: '1',
        action: 'Aprovou dispositivo',
        target: 'iPhone 15 Pro',
        timestamp: '2025-09-18T22:45:00Z',
        type: 'create'
      },
      {
        id: '2',
        action: 'Atualizou política',
        target: 'Política de Segurança',
        timestamp: '2025-09-18T21:30:00Z',
        type: 'update'
      },
      {
        id: '3',
        action: 'Removeu dispositivo',
        target: 'Samsung Galaxy S23',
        timestamp: '2025-09-18T20:15:00Z',
        type: 'delete'
      }
    ]);
  }, []);

  // Função de busca com dados reais
  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Buscar dispositivos reais de forma assíncrona
      const fetchDevices = async () => {
        try {
          const devices = await searchDevices(searchQuery);
          
          // Converter para formato SearchResult
          const deviceResults: SearchResult[] = devices.map(device => ({
            id: device.id,
            type: 'device' as const,
            title: device.name,
            subtitle: `${device.ownerName} • ${getStatusName(device.status)} • ${formatLastSeen(device.lastSeen)}`,
            status: device.status,
            icon: device.deviceModel.toLowerCase().includes('iphone') || device.deviceModel.toLowerCase().includes('android') || device.deviceModel.toLowerCase().includes('samsung') || device.deviceModel.toLowerCase().includes('xiaomi') ? Smartphone : Monitor,
            device: device
      }));

      // Adicionar outros tipos de busca (políticas, usuários) - simulados por agora
      const otherResults: SearchResult[] = [];
      
      if (searchQuery.toLowerCase().includes('política') || searchQuery.toLowerCase().includes('policy')) {
        otherResults.push({
          id: 'policy-1',
          type: 'policy' as const,
          title: 'Política de Localização',
          subtitle: '12 dispositivos aplicados',
          icon: Shield
        });
      }
      
      if (searchQuery.toLowerCase().includes('user') || searchQuery.toLowerCase().includes('usuário')) {
        otherResults.push({
          id: 'user-1',
          type: 'user' as const,
          title: 'Usuários do Sistema',
          subtitle: 'Gerenciar usuários',
          icon: User
        });
      }

      setSearchResults([...deviceResults, ...otherResults]);
        } catch (error) {
          console.error('Erro ao buscar dispositivos:', error);
          setSearchResults([]);
        }
      };
      
      fetchDevices();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleMarkAllAlertsRead = () => {
    const allAlertIds = alerts.map(alert => alert.id);
    localStorage.setItem('readAlerts', JSON.stringify(allAlertIds));
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const handleMarkAlertRead = (alertId: string) => {
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    if (!readAlerts.includes(alertId)) {
      readAlerts.push(alertId);
      localStorage.setItem('readAlerts', JSON.stringify(readAlerts));
    }
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return Clock;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Dispositivos', href: '/devices', icon: Smartphone },
    { name: 'Políticas', href: '/policies', icon: Shield },
    { name: 'Pendentes', href: '/pending-devices', icon: Settings, badge: 0 },
  ];

  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

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
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
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
            {/* Busca Inteligente */}
            <div className="hidden md:flex relative" ref={searchRef}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {searchOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 z-[60]">
                  <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Header da Busca */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar dispositivos, usuários, políticas..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Resultados da Busca */}
                    <div className="max-h-80 overflow-y-auto">
                      {searchQuery.length >= 2 ? (
                        searchResults.length > 0 ? (
                          <div className="p-2">
                            {searchResults.map((result) => {
                              const Icon = result.icon;
                              return (
                                <Link
                                  key={result.id}
                                  href={`/${result.type === 'device' ? 'devices' : result.type === 'policy' ? 'policies' : 'users'}/${result.id}`}
                                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                  onClick={() => setSearchOpen(false)}
                                >
                                  <div className={`p-2 rounded-lg ${
                                    result.type === 'device' ? 'bg-blue-100 text-blue-600' :
                                    result.type === 'user' ? 'bg-green-100 text-green-600' :
                                    'bg-purple-100 text-purple-600'
                                  }`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900 truncate">{result.title}</span>
                                      {result.status && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                                          {getStatusName(result.status)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                                    {result.device && (
                                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                                        <span className="flex items-center space-x-1">
                                          <Monitor className="h-3 w-3" />
                                          <span className="truncate">{result.device.deviceModel}</span>
                                        </span>
                                        {result.device.location && (
                                          <span className="flex items-center space-x-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate max-w-32">{result.device.location.split(' - ')[0]}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p>Nenhum resultado encontrado</p>
                          </div>
                        )
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p>Digite pelo menos 2 caracteres para buscar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sistema de Alertas */}
            <div className="relative" ref={alertsRef}>
              <button 
                onClick={() => setAlertsOpen(!alertsOpen)}
                className="relative p-2 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[60]">
                  {/* Header dos Alertas */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
                      {unreadAlertsCount > 0 && (
                        <button
                          onClick={handleMarkAllAlertsRead}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marcar todos como lidos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Alertas */}
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length > 0 ? (
                      <div className="p-2">
                        {alerts.map((alert) => {
                          const Icon = getAlertIcon(alert.type);
                          return (
                            <div
                              key={alert.id}
                              className={`p-3 rounded-lg mb-2 border transition-all cursor-pointer hover:shadow-sm ${
                                !alert.read ? getAlertColor(alert.type) : 'bg-gray-50 border-gray-200'
                              }`}
                              onClick={() => handleMarkAlertRead(alert.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <Icon className={`w-5 h-5 mt-0.5 ${
                                  !alert.read 
                                    ? alert.type === 'error' ? 'text-red-600' :
                                      alert.type === 'warning' ? 'text-orange-600' :
                                      alert.type === 'success' ? 'text-green-600' : 'text-blue-600'
                                    : 'text-gray-400'
                                }`} />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`font-medium ${!alert.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                      {alert.title}
                                    </h4>
                                    {!alert.read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  <p className={`text-sm ${!alert.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTimeAgo(alert.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p>Nenhum alerta no momento</p>
                      </div>
                    )}
                  </div>

                  {/* Footer dos Alertas */}
                  <div className="p-4 border-t border-gray-100">
                    <Link
                      href="/alerts"
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => setAlertsOpen(false)}
                    >
                      Ver todos os alertas
                    </Link>
                  </div>
                </div>
              )}
            </div>

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
                  
                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
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
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
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

      {/* Modal de Configurações */}
      {settingsOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSettingsOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-auto my-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex h-[calc(90vh-160px)]">
              {/* Sidebar de Navegação */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                <nav className="space-y-1">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg bg-blue-50 text-blue-700 font-medium">
                    <Settings className="h-4 w-4" />
                    <span>Sistema</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-100">
                    <Bell className="h-4 w-4" />
                    <span>Notificações</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-100">
                    <Lock className="h-4 w-4" />
                    <span>Segurança</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-100">
                    <Globe className="h-4 w-4" />
                    <span>Integração</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-100">
                    <Database className="h-4 w-4" />
                    <span>Backup</span>
                  </button>
                </nav>
              </div>

              {/* Área de Conteúdo */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Preferências do Sistema */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferências do Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Escuro</option>
                          <option>Claro</option>
                          <option>Automático</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Português (BR)</option>
                          <option>English (US)</option>
                          <option>Español</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>UTC-3 (Brasília)</option>
                          <option>UTC-5 (Nova York)</option>
                          <option>UTC+0 (Londres)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Data</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>DD/MM/AAAA</option>
                          <option>MM/DD/AAAA</option>
                          <option>AAAA-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Configurações de Performance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Auto-refresh do Dashboard</h4>
                          <p className="text-sm text-gray-500">Atualizar dados automaticamente a cada 30 segundos</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Animações</h4>
                          <p className="text-sm text-gray-500">Ativar animações da interface</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Perfil */}
      {profileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setProfileOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-auto my-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Perfil do Usuário</h2>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informações Pessoais */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                        <input 
                          type="text" 
                          defaultValue="Administrador do Sistema"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input 
                          type="email" 
                          defaultValue={user?.email || 'admin@coruzen.com'}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                        <input 
                          type="text" 
                          defaultValue="Administrador Principal"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                        <input 
                          type="text" 
                          defaultValue="TI - Infraestrutura"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Atividade Recente */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'create' ? 'bg-green-100 text-green-600' :
                            activity.type === 'update' ? 'bg-blue-100 text-blue-600' :
                            activity.type === 'delete' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.type === 'create' && <Plus className="h-4 w-4" />}
                            {activity.type === 'update' && <Edit3 className="h-4 w-4" />}
                            {activity.type === 'delete' && <X className="h-4 w-4" />}
                            {activity.type === 'access' && <Eye className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-500">{activity.target}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Estatísticas e Avatar */}
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Alterar Foto
                    </button>
                  </div>

                  {/* Estatísticas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Dispositivos</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{userStats.devicesManaged}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Activity className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900">Ações Hoje</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{userStats.actionsToday}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-gray-900">Alertas Resolvidos</span>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">{userStats.alertsResolved}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Uptime</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">{userStats.uptime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setProfileOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Salvar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}