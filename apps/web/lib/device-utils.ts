// Utilities for device search and data synchronization
import { Device } from '@/lib/api-service'

export interface SearchableDevice {
  id: string
  name: string
  deviceModel: string
  status: 'online' | 'offline' | 'inactive'
  ownerName?: string
  location?: string
  lastSeen: Date
}

// Mock devices data - em produção, viria do banco de dados
export const getAllDevices = (): SearchableDevice[] => {
  return [
    {
      id: 'DESK-001',
      name: 'Desktop - Sala 1',
      deviceModel: 'Dell OptiPlex 7090',
      status: 'online',
      ownerName: 'Carlos Silva',
      location: 'São Paulo, SP - Andar 3, Sala 301',
      lastSeen: new Date(Date.now() - 1000 * 60 * 5) // 5 min atrás
    },
    {
      id: 'MOB-003',
      name: 'Mobile - João Silva',
      deviceModel: 'Samsung Galaxy S21',
      status: 'online',
      ownerName: 'João Silva',
      location: 'Rio de Janeiro, RJ - Home Office',
      lastSeen: new Date(Date.now() - 1000 * 60 * 2) // 2 min atrás
    },
    {
      id: 'TAB-002',
      name: 'Tablet - Conferência',
      deviceModel: 'iPad Pro 12.9"',
      status: 'inactive',
      ownerName: 'Sala de Reunião',
      location: 'Brasília, DF - Sala de Conferência A',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 horas atrás
    },
    {
      id: 'DESK-002',
      name: 'Desktop - Sala 2',
      deviceModel: 'HP EliteDesk 800',
      status: 'offline',
      ownerName: 'Maria Santos',
      location: 'São Paulo, SP - Andar 2, Sala 205',
      lastSeen: new Date(Date.now() - 1000 * 60 * 45) // 45 min atrás
    },
    {
      id: 'DESK-003',
      name: 'Desktop - Desenvolvimento',
      deviceModel: 'MacBook Pro M2',
      status: 'online',
      ownerName: 'Pedro Costa',
      location: 'Belo Horizonte, MG - Setor Dev',
      lastSeen: new Date(Date.now() - 1000 * 60 * 1) // 1 min atrás
    },
    {
      id: 'MOB-005',
      name: 'iPhone - Ana Clara',
      deviceModel: 'iPhone 14 Pro',
      status: 'online',
      ownerName: 'Ana Clara',
      location: 'Salvador, BA - Filial Nordeste',
      lastSeen: new Date(Date.now() - 1000 * 60 * 8) // 8 min atrás
    },
    {
      id: 'TAB-004',
      name: 'Tablet - Vendas',
      deviceModel: 'Samsung Galaxy Tab S8',
      status: 'online',
      ownerName: 'Equipe Vendas',
      location: 'Porto Alegre, RS - Setor Comercial',
      lastSeen: new Date(Date.now() - 1000 * 60 * 12) // 12 min atrás
    },
    {
      id: 'DESK-007',
      name: 'Workstation - Designer',
      deviceModel: 'iMac 27" M1',
      status: 'online',
      ownerName: 'Sofia Lima',
      location: 'Recife, PE - Estúdio Criativo',
      lastSeen: new Date(Date.now() - 1000 * 60 * 3) // 3 min atrás
    },
    {
      id: 'MOB-006',
      name: 'Android - Roberto',
      deviceModel: 'Xiaomi Mi 11',
      status: 'offline',
      ownerName: 'Roberto Alves',
      location: 'Curitiba, PR - Departamento TI',
      lastSeen: new Date(Date.now() - 1000 * 60 * 120) // 2 horas atrás
    },
    {
      id: 'DESK-008',
      name: 'Notebook - Suporte',
      deviceModel: 'Lenovo ThinkPad X1',
      status: 'inactive',
      ownerName: 'Equipe Suporte',
      location: 'Fortaleza, CE - Central de Atendimento',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 horas atrás
    }
  ]
}

// Função para buscar dispositivos
export const searchDevices = (query: string): SearchableDevice[] => {
  if (!query.trim()) return []
  
  const devices = getAllDevices()
  const searchTerm = query.toLowerCase()
  
  return devices.filter(device => 
    device.name.toLowerCase().includes(searchTerm) ||
    device.deviceModel.toLowerCase().includes(searchTerm) ||
    device.id.toLowerCase().includes(searchTerm) ||
    device.ownerName?.toLowerCase().includes(searchTerm) ||
    device.location?.toLowerCase().includes(searchTerm)
  ).slice(0, 8) // Limitar a 8 resultados
}

// Função para formatar tempo
export const formatLastSeen = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // menos de 1 minuto
    return 'Agora'
  } else if (diff < 3600000) { // menos de 1 hora
    const minutes = Math.floor(diff / 60000)
    return `${minutes} min atrás`
  } else if (diff < 86400000) { // menos de 24 horas
    const hours = Math.floor(diff / 3600000)
    return `${hours}h atrás`
  } else {
    const days = Math.floor(diff / 86400000)
    return `${days}d atrás`
  }
}

// Função para obter cor do status
export const getStatusColor = (status: SearchableDevice['status']): string => {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-100'
    case 'offline':
      return 'text-red-600 bg-red-100'
    case 'inactive':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Função para obter nome do status
export const getStatusName = (status: SearchableDevice['status']): string => {
  switch (status) {
    case 'online':
      return 'Online'
    case 'offline':
      return 'Offline'
    case 'inactive':
      return 'Inativo'
    default:
      return 'Desconhecido'
  }
}