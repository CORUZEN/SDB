'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Monitor,
  MapPin,
  Filter,
  Search,
  X,
  Bell,
  Activity
} from 'lucide-react'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  source: string
  deviceId?: string
  deviceName?: string
  location?: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'info' | 'success'>('all')
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all')
  const [loading, setLoading] = useState(true)

  // Carregar alertas (simulado)
  useEffect(() => {
    const loadAlerts = () => {
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'critical',
          title: 'Falha de Segurança Detectada',
          message: 'Tentativa de acesso não autorizado detectada no dispositivo DESK-001.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min atrás
          read: false,
          source: 'Sistema de Segurança',
          deviceId: 'DESK-001',
          deviceName: 'Desktop - Sala 1',
          location: 'São Paulo, SP'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Bateria Baixa',
          message: 'Dispositivo móvel MOB-003 com bateria em 15%.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
          read: false,
          source: 'Monitor de Hardware',
          deviceId: 'MOB-003',
          deviceName: 'Mobile - João Silva',
          location: 'Rio de Janeiro, RJ'
        },
        {
          id: '3',
          type: 'info',
          title: 'Atualização Disponível',
          message: 'Nova versão do sistema operacional disponível para TAB-002.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
          read: true,
          source: 'Central de Atualizações',
          deviceId: 'TAB-002',
          deviceName: 'Tablet - Conferência',
          location: 'Brasília, DF'
        },
        {
          id: '4',
          type: 'success',
          title: 'Backup Concluído',
          message: 'Backup automático realizado com sucesso em todos os dispositivos.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          read: true,
          source: 'Sistema de Backup',
        },
        {
          id: '5',
          type: 'critical',
          title: 'Dispositivo Desconectado',
          message: 'DESK-002 perdeu conexão há mais de 30 minutos.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min atrás
          read: false,
          source: 'Monitor de Conectividade',
          deviceId: 'DESK-002',
          deviceName: 'Desktop - Sala 2',
          location: 'São Paulo, SP'
        },
        {
          id: '6',
          type: 'warning',
          title: 'Uso Excessivo de CPU',
          message: 'DESK-003 apresentando uso de CPU acima de 90% por mais de 10 minutos.',
          timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 min atrás
          read: false,
          source: 'Monitor de Performance',
          deviceId: 'DESK-003',
          deviceName: 'Desktop - Desenvolvimento',
          location: 'Belo Horizonte, MG'
        }
      ]
      
      setAlerts(mockAlerts)
      setFilteredAlerts(mockAlerts)
      setLoading(false)
    }

    loadAlerts()
  }, [])

  // Filtrar alertas
  useEffect(() => {
    let filtered = alerts

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType)
    }

    // Filtro por status de leitura
    if (filterRead !== 'all') {
      filtered = filtered.filter(alert => 
        filterRead === 'read' ? alert.read : !alert.read
      )
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.deviceName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAlerts(filtered)
  }, [alerts, filterType, filterRead, searchTerm])

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'info':
        return 'border-l-blue-500 bg-blue-50'
      case 'success':
        return 'border-l-green-500 bg-green-50'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    
    if (diff < 60000) { // menos de 1 minuto
      return 'Agora mesmo'
    } else if (diff < 3600000) { // menos de 1 hora
      const minutes = Math.floor(diff / 60000)
      return `${minutes} min atrás`
    } else if (diff < 86400000) { // menos de 24 horas
      const hours = Math.floor(diff / 3600000)
      return `${hours}h atrás`
    } else {
      return timestamp.toLocaleDateString('pt-BR')
    }
  }

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ))
  }

  const handleMarkAsUnread = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: false } : alert
    ))
  }

  const handleMarkAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
  }

  const unreadCount = alerts.filter(alert => !alert.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} alertas não lidos` : 'Todos os alertas foram lidos'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Marcar Todos como Lidos
            </button>
          )}
        </div>

        {/* Controles de Filtro */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar alertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filtro por Tipo */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="critical">Crítico</option>
              <option value="warning">Aviso</option>
              <option value="info">Informação</option>
              <option value="success">Sucesso</option>
            </select>

            {/* Filtro por Status */}
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="unread">Não Lidos</option>
              <option value="read">Lidos</option>
            </select>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' || filterRead !== 'all' 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Não há alertas no momento.'
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${getAlertColor(alert.type)} p-6 ${
                  !alert.read ? 'ring-2 ring-blue-100' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className={`text-lg font-semibold ${!alert.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alert.title}
                          {!alert.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h3>
                        <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600">{alert.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Activity className="h-4 w-4" />
                          <span>{alert.source}</span>
                        </span>
                        
                        {alert.deviceName && (
                          <span className="flex items-center space-x-1">
                            <Monitor className="h-4 w-4" />
                            <span>{alert.deviceName}</span>
                          </span>
                        )}
                        
                        {alert.location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{alert.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {alert.read ? (
                      <button
                        onClick={() => handleMarkAsUnread(alert.id)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        Marcar como não lido
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}