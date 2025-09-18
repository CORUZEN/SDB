'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  captured_at: string;
  source: string;
}

interface DeviceMapProps {
  deviceId: string;
  deviceName: string;
  locations: Location[];
  className?: string;
}

export default function DeviceMap({ deviceId, deviceName, locations, className }: DeviceMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Posição padrão (São Paulo) se não houver localizações
  const defaultPosition: [number, number] = [-23.5505, -46.6333];
  const latestLocation = locations[0];
  const position: [number, number] = latestLocation 
    ? [latestLocation.latitude, latestLocation.longitude] 
    : defaultPosition;

  useEffect(() => {
    // Ajustar o mapa quando houver novas localizações
    if (mapRef.current && latestLocation) {
      mapRef.current.setView([latestLocation.latitude, latestLocation.longitude], 15);
    }
  }, [latestLocation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return '';
    if (accuracy < 10) return 'Muito precisa';
    if (accuracy < 50) return 'Precisa';
    if (accuracy < 100) return 'Boa';
    return 'Aproximada';
  };

  return (
    <div className={`${className} relative`}>
      <MapContainer
        center={position}
        zoom={latestLocation ? 15 : 10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((location, index) => (
          <Marker 
            key={location.id} 
            position={[location.latitude, location.longitude]}
            opacity={index === 0 ? 1 : 0.6} // Mais opaco para a localização mais recente
          >
            <Popup>
              <div className="text-sm">
                <h4 className="font-semibold">{deviceName}</h4>
                <p className="text-gray-600 mt-1">
                  <strong>Data:</strong> {formatDate(location.captured_at)}
                </p>
                {location.accuracy && (
                  <p className="text-gray-600">
                    <strong>Precisão:</strong> {location.accuracy}m ({getAccuracyText(location.accuracy)})
                  </p>
                )}
                <p className="text-gray-600">
                  <strong>Fonte:</strong> {location.source}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {!latestLocation && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Nenhuma localização disponível</p>
            <p className="text-sm text-gray-500">Clique em &quot;Localizar&quot; para obter a posição do dispositivo</p>
          </div>
        </div>
      )}
    </div>
  );
}