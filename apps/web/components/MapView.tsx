'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Smartphone } from 'lucide-react';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  bearing?: number | null;
  source: 'gps' | 'network' | 'passive' | 'fused';
  captured_at: string;
  created_at: string;
}

interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'inactive';
  locations?: Location[];
}

interface MapViewProps {
  devices: Device[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onLocationClick?: (location: Location, device: Device) => void;
}

export default function MapView({ 
  devices, 
  height = '400px', 
  center = [-23.5505, -46.6333], // São Paulo como padrão
  zoom = 10,
  onLocationClick 
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Criar mapa se não existir
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Adicionar tile layer do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Limpar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Adicionar marcadores para cada dispositivo com localização
    const bounds: L.LatLngBounds[] = [];
    
    devices.forEach((device) => {
      if (device.locations && device.locations.length > 0) {
        // Usar a localização mais recente
        const latestLocation = device.locations.sort(
          (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
        )[0];

        const latlng = L.latLng(latestLocation.latitude, latestLocation.longitude);
        
        // Criar ícone customizado baseado no status
        const iconColor = device.status === 'online' ? 'green' : 
                         device.status === 'offline' ? 'red' : 'orange';
        
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${iconColor};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M21 16V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
              </svg>
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker(latlng, { icon: customIcon }).addTo(map);
        
        // Popup com informações do dispositivo
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${device.name}</h3>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Status:</strong> 
              <span style="color: ${iconColor}; text-transform: capitalize;">${device.status}</span>
            </p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Última localização:</strong></p>
            <p style="margin: 2px 0; font-size: 11px; color: #666;">
              ${new Date(latestLocation.captured_at).toLocaleString('pt-BR')}
            </p>
            ${latestLocation.accuracy ? 
              `<p style="margin: 2px 0; font-size: 11px; color: #666;">
                Precisão: ${latestLocation.accuracy}m
              </p>` : ''
            }
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
              ${latestLocation.latitude.toFixed(6)}, ${latestLocation.longitude.toFixed(6)}
            </p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Event listener para clique no marcador
        if (onLocationClick) {
          marker.on('click', () => {
            onLocationClick(latestLocation, device);
          });
        }

        bounds.push(L.latLngBounds([latlng, latlng]));
      }
    });

    // Ajustar zoom para mostrar todos os marcadores se houver algum
    if (bounds.length > 0) {
      const group = new L.FeatureGroup(bounds.map(b => L.rectangle(b)));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [devices, center, zoom, onLocationClick]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-200 shadow-sm"
      />
      
      {/* Legend */}
      <div className="absolute top-2 right-2 bg-white p-2 rounded-lg shadow-md border text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Inativo</span>
          </div>
        </div>
      </div>
      
      {/* Empty state */}
      {devices.filter(d => d.locations && d.locations.length > 0).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma localização encontrada
            </h3>
            <p className="text-gray-600">
              Os dispositivos ainda não reportaram suas localizações
            </p>
          </div>
        </div>
      )}
    </div>
  );
}