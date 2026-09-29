import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ShieldAlert } from 'lucide-react';

// Fix Leaflet's default icon path issues with Next.js
// @ts-expect-error Leaflet prototype modifying
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons based on health
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const iconGreen = createCustomIcon('#22c55e');
const iconOrange = createCustomIcon('#f97316');
const iconRed = createCustomIcon('#ef4444');

type SiteNode = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  health: string;
  activeAlarms: number;
  availability: number;
  cells: CellNode[];
};

type CellNode = {
  id: string;
  technology: string;
  latency: number;
  trafficGb: number;
  anomalies: number;
};

interface NetworkMapProps {
  data: SiteNode[];
  onSelectSite: (site: SiteNode) => void;
}

export default function NetworkMap({ data, onSelectSite }: NetworkMapProps) {
  const center: [number, number] = [40.7128, -74.0060]; // NYC Default

  const getIcon = (health: string) => {
    if (health === 'CRITICAL') return iconRed;
    if (health === 'DEGRADED') return iconOrange;
    return iconGreen;
  };

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {data.map((site) => (
        <React.Fragment key={site.id}>
          {/* Signal Range Circle */}
          <Circle 
            center={[site.lat, site.lng]} 
            radius={2000} 
            pathOptions={{ 
              fillColor: site.health === 'CRITICAL' ? '#ef4444' : site.health === 'DEGRADED' ? '#f97316' : '#3b82f6', 
              fillOpacity: 0.1, 
              color: 'transparent' 
            }} 
          />
          
          <Marker 
            position={[site.lat, site.lng]} 
            icon={getIcon(site.health)}
            eventHandlers={{
              click: () => onSelectSite(site),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-gray-900 border-b pb-1 mb-2">{site.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-gray-50 p-1.5 rounded">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase">Health</span>
                    <span className={`text-xs font-bold ${site.health === 'CRITICAL' ? 'text-red-600' : site.health === 'DEGRADED' ? 'text-orange-600' : 'text-green-600'}`}>
                      {site.health}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-1.5 rounded">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase">Availability</span>
                    <span className="text-xs font-bold text-gray-900">{site.availability}%</span>
                  </div>
                </div>

                <div className="text-xs text-red-600 font-bold flex items-center mb-2">
                  <ShieldAlert size={12} className="mr-1" /> {site.activeAlarms} Active Alarms
                </div>

                <button 
                  onClick={() => onSelectSite(site)}
                  className="w-full bg-blue-600 text-white text-xs font-bold py-1.5 rounded mt-1"
                >
                  Open Site Intelligence
                </button>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </MapContainer>
  );
}
