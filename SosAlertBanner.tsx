import React from 'react';
import { AlertTriangle, MapPin, PhoneCall, Video, CheckCircle, X } from 'lucide-react';
import { ActiveTab } from '../../types';

interface SosAlertBannerProps {
  alert: {
    childName: string;
    location?: {
      address: string;
      latitude: number;
      longitude: number;
    };
    battery?: number;
    timestamp: number;
  } | null;
  onDismiss: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const SosAlertBanner: React.FC<SosAlertBannerProps> = ({
  alert,
  onDismiss,
  onNavigateTab
}) => {
  if (!alert) return null;

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-bounce">
      <div className="bg-red-950 border-2 border-red-500 rounded-2xl p-5 shadow-2xl text-white space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center animate-pulse shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 px-2 py-0.5 rounded-full text-white">
                EMERGENCY SOS TRIGGERED
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {alert.childName} pressed Emergency SOS!
              </h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-red-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-red-100 bg-red-900/50 p-2.5 rounded-xl space-y-1">
          <p className="flex items-center gap-1 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-red-300" />
            Location: {alert.location?.address || 'GPS Coordinates pinned'}
          </p>
          <p className="text-[11px] text-red-200">
            Battery: {alert.battery ?? 78}% • Time: {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              onNavigateTab('location');
              onDismiss();
            }}
            className="py-2 px-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <MapPin className="w-4 h-4" />
            Track on Map
          </button>
          <button
            onClick={() => {
              onNavigateTab('livestream');
              onDismiss();
            }}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-red-500/50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Video className="w-4 h-4 text-red-400" />
            Open Camera
          </button>
        </div>
      </div>
    </div>
  );
};
