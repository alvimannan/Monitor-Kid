import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Plus, 
  Layers, 
  Clock, 
  ShieldCheck, 
  AlertOctagon, 
  School, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Compass
} from 'lucide-react';
import { ChildDevice, GeofenceZone, LocationBreadcrumb } from '../../types';
import L from 'leaflet';

interface ParentLocationMapProps {
  device: ChildDevice;
  onRefreshGps: () => void;
  onAddGeofence: (zone: Omit<GeofenceZone, 'id'>) => void;
}

const mockBreadcrumbs: LocationBreadcrumb[] = [
  { id: 'b1', latitude: 37.7833, longitude: -122.4167, timeString: '08:15 AM', locationName: 'Left Home' },
  { id: 'b2', latitude: 37.7780, longitude: -122.4180, timeString: '08:32 AM', locationName: 'Transit Bus Stop #42' },
  { id: 'b3', latitude: 37.7749, longitude: -122.4194, timeString: '08:48 AM', locationName: 'Arrived at Lincoln Middle School' },
  { id: 'b4', latitude: 37.7749, longitude: -122.4194, timeString: 'Current (11:05 AM)', locationName: 'Classroom Wing B (Inside Safe Zone)' }
];

export const ParentLocationMap: React.FC<ParentLocationMapProps> = ({
  device,
  onRefreshGps,
  onAddGeofence
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const geofenceLayersRef = useRef<L.Circle[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState(250);
  const [newZoneType, setNewZoneType] = useState<'safe' | 'school' | 'restricted'>('safe');
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<string>('b4');

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [device.location.latitude, device.location.longitude],
        zoom: 15,
        zoomControl: true,
      });

      // CartoDB Voyager / OpenStreetMap tiles (crisp & modern)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const latlng: L.LatLngTuple = [device.location.latitude, device.location.longitude];

    // Marker
    if (!markerRef.current) {
      const customIcon = L.divIcon({
        className: 'custom-child-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-indigo-500/30 animate-ping"></span>
            <div class="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
              ${device.childName.charAt(0)}
            </div>
            <span class="absolute -bottom-4 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
              ${device.childName}
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      markerRef.current = L.marker(latlng, { icon: customIcon }).addTo(map);
      markerRef.current.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="font-weight: bold; margin: 0; font-size: 14px;">${device.name}</h4>
          <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">${device.location.address}</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #10b981; font-weight: bold;">Battery: ${device.batteryLevel}%</p>
        </div>
      `);
    } else {
      markerRef.current.setLatLng(latlng);
    }

    // Accuracy Circle
    if (!circleRef.current) {
      circleRef.current = L.circle(latlng, {
        radius: Math.max(15, device.location.accuracy),
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(latlng);
      circleRef.current.setRadius(Math.max(15, device.location.accuracy));
    }

    // Clear and redraw geofences
    geofenceLayersRef.current.forEach(layer => layer.remove());
    geofenceLayersRef.current = [];

    device.geofences.forEach(zone => {
      const color = zone.type === 'school' ? '#f59e0b' : zone.type === 'restricted' ? '#ef4444' : '#10b981';
      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '4, 4'
      }).addTo(map);

      circle.bindTooltip(`<strong>${zone.name}</strong><br/>Type: ${zone.type.toUpperCase()}`, {
        permanent: false,
        direction: 'top'
      });

      geofenceLayersRef.current.push(circle);
    });

    map.panTo(latlng);

    return () => {
      // Keep map instance across renders
    };
  }, [device.location, device.geofences]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshGps();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const handleSaveGeofence = () => {
    if (!newZoneName.trim()) return;
    onAddGeofence({
      name: newZoneName,
      latitude: device.location.latitude,
      longitude: device.location.longitude,
      radiusMeters: newZoneRadius,
      type: newZoneType
    });
    setNewZoneName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            Live GPS & Geofencing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time coordinates updated via FusedLocationProviderClient (High Precision)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-geofence"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow"
          >
            <Plus className="w-4 h-4" />
            Add Safe Zone
          </button>

          <button
            id="btn-refresh-gps"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            {isRefreshing ? 'Locating...' : 'Refresh GPS'}
          </button>
        </div>
      </div>

      {/* Map Container + Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Live Badge */}
            <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-white text-xs shadow-lg flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-emerald-400">GPS Live</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="font-medium text-slate-200">{device.location.address}</span>
            </div>

            {/* Recenter Button */}
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([device.location.latitude, device.location.longitude], 16);
                }
              }}
              className="absolute bottom-6 right-6 z-[400] bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-xl transition"
              title="Recenter Map on Child"
            >
              <Compass className="w-5 h-5" />
            </button>
          </div>

          {/* Active Geofence Legend */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Geofence Zones:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500" />
              <span>Safe Zone (Home, Park)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500" />
              <span>School Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" />
              <span>Restricted Zone</span>
            </div>
          </div>
        </div>

        {/* Right Column: Location History Timeline & Geofence List */}
        <div className="space-y-4">
          {/* Geofences Configured */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Active Geofence Zones ({device.geofences.length})
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + New Zone
              </button>
            </div>

            <div className="space-y-2.5">
              {device.geofences.map(zone => (
                <div key={zone.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      zone.type === 'school' 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : zone.type === 'restricted'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {zone.type === 'school' ? <School className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{zone.name}</p>
                      <p className="text-[10px] text-slate-400">Radius: {zone.radiusMeters} meters</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                    {zone.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Breadcrumb Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Today's Route Timeline
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {mockBreadcrumbs.map((crumb, idx) => {
                const isSelected = selectedTimelineItem === crumb.id;
                return (
                  <div
                    key={crumb.id}
                    onClick={() => {
                      setSelectedTimelineItem(crumb.id);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([crumb.latitude, crumb.longitude]);
                      }
                    }}
                    className={`relative pl-8 cursor-pointer group transition p-2 rounded-xl ${
                      isSelected ? 'bg-indigo-950/40 border border-indigo-500/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`absolute left-2.5 top-3.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 ${
                      idx === mockBreadcrumbs.length - 1 ? 'bg-emerald-400' : 'bg-indigo-400'
                    }`} />
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-semibold text-slate-200">{crumb.locationName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{crumb.timeString}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Geofence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Create New Geofence Zone</h3>
            <p className="text-xs text-slate-400">
              Receive instant push alerts whenever {device.childName} enters or leaves this perimeter.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grandma's House, Soccer Field"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Radius: {newZoneRadius} meters
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={newZoneRadius}
                  onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>100m (Building)</span>
                  <span>500m (Neighborhood)</span>
                  <span>1000m (District)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Zone Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewZoneType('safe')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      newZoneType === 'safe'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Safe Zone
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewZoneType('school')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      newZoneType === 'school'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    School
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewZoneType('restricted')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      newZoneType === 'restricted'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Restricted
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGeofence}
                disabled={!newZoneName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
              >
                Save Geofence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
