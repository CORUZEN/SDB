'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Wifi, 
  WifiOff,
  Battery, 
  Clock, 
  AlertTriangle,
  MapPin,
  Edit3,
  ExternalLink,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero
} from 'lucide-react';
import type { Device as DeviceType } from '@/lib/api-service';

interface OptimizedDeviceCardProps {
  device: DeviceType;
  onEdit: (device: DeviceType) => void;
  onLocate: (device: DeviceType) => void;
  isLoading?: boolean;
}

// Memoized status color calculation
const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'idle':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'offline':
    case 'inactive':
      return 'text-red-600 bg-red-100 border-red-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

// Memoized status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online':
      return <Wifi className="w-3 h-3" />;
    case 'offline':
    case 'inactive':
      return <WifiOff className="w-3 h-3" />;
    default:
      return <AlertTriangle className="w-3 h-3" />;
  }
};

// Memoized battery color
const getBatteryColor = (level: number | null) => {
  if (!level) return 'text-gray-400';
  if (level > 60) return 'text-green-600';
  if (level > 30) return 'text-yellow-600';
  return 'text-red-600';
};

// Memoized last seen formatting
const formatLastSeen = (lastSeen: string | null) => {
  if (!lastSeen) return 'Nunca';
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
  return `${Math.floor(diffMinutes / 1440)}d`;
};

const OptimizedDeviceCard = memo<OptimizedDeviceCardProps>(({ 
  device, 
  onEdit, 
  onLocate,
  isLoading = false 
}) => {
  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useCallback(() => onEdit(device), [onEdit, device]);
  const handleLocate = useCallback(() => onLocate(device), [onLocate, device]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
            <div className="ml-3">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
        </div>
        
        <div className="space-y-3">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
          <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
          <div className="h-8 w-8 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900 text-lg truncate" title={device.name}>
              {device.name || `Device-${device.id.slice(-6)}`}
            </h3>
            <p className="text-sm text-gray-500">ID: {device.id.slice(-8)}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
          {getStatusIcon(device.status)}
          <span className="ml-1 capitalize">{device.status || 'offline'}</span>
        </span>
      </div>

      {/* Device Info */}
      <div className="space-y-3">
        {/* Battery */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Battery className={`w-4 h-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
            <span className="text-gray-600">Bateria:</span>
          </div>
          <span className={`font-medium ${getBatteryColor(device.battery_level)}`}>
            {device.battery_level ? `${device.battery_level}%` : 'N/A'}
          </span>
        </div>

        {/* Last Seen */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Última atividade:</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatLastSeen(device.last_seen_at)}
          </span>
        </div>

        {/* Network/Owner */}
        {device.owner && (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Proprietário:</span>
            </div>
            <span className="text-sm font-medium text-gray-700 truncate max-w-24" title={device.owner}>
              {device.owner}
            </span>
          </div>
        )}
      </div>

      {/* OS Version */}
      {device.os_version && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Sistema:</span> {device.os_version}
          </p>
        </div>
      )}

      {/* Tags */}
      {device.tags && device.tags.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1">
            {device.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {tag}
              </span>
            ))}
            {device.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{device.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleLocate}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Localizar dispositivo"
        >
          <MapPin className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleEdit}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Editar dispositivo"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        
        <Link
          href={`/devices/${device.id}`}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          title="Ver detalhes"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
});

OptimizedDeviceCard.displayName = 'OptimizedDeviceCard';

export default OptimizedDeviceCard;