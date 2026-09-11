import React from 'react';
import { 
  Shield, 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  MapPin, 
  Clock, 
  Lock, 
  Unlock, 
  Video, 
  Mic, 
  Cast, 
  Volume2, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  Wifi,
  Radio,
  ExternalLink
} from 'lucide-react';
import { ChildDevice, ActiveTab } from '../../types';

interface ParentDashboardProps {
  device: ChildDevice;
  onNavigateTab: (tab: ActiveTab) => void;
  onLockToggle: () => void;
  onQuickStream: (mode: 'camera' | 'audio' | 'screen') => void;
  onPlaySiren: () => void;
  onSwitchCamera: () => void;
  onOpenCodeModal: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  device,
  onNavigateTab,
  onLockToggle,
  onQuickStream,
  onPlaySiren,
  onSwitchCamera,
  onOpenCodeModal
}) => {
  const percentUsed = Math.min(100, Math.round((device.todayScreenTimeUsedMinutes / device.dailyScreenTimeLimitMinutes) * 100));
  const remainingMinutes = Math.max(0, device.dailyScreenTimeLimitMinutes - device.todayScreenTimeUsedMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMinsRem = remainingMinutes % 60;

  const flaggedNotifications = device.notifications.filter(n => n.isFlagged);

  return (
    <div className="space-y-6 pb-12">
      {/* Device Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${device.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{device.name}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {device.platform === 'android' ? 'Android 14' : 'iOS 17.5'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
                <span>•</span>
                <span>{device.model}</span>
                <span>•</span>
                <span>Active app: <strong className="text-indigo-300">{device.currentAppRunning}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Lock Button */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
              {device.isCharging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              ) : (
                <Battery className={`w-4 h-4 ${device.batteryLevel < 20 ? 'text-red-400' : 'text-slate-300'}`} />
              )}
              <span className="text-sm font-semibold text-slate-200">{device.batteryLevel}%</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Strong (5G)</span>
            </div>

            <button
              id="btn-quick-lock-toggle"
              onClick={onLockToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-md ${
                device.isLocked 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold' 
                  : 'bg-red-500/90 hover:bg-red-500 text-white'
              }`}
            >
              {device.isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock Device
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Lock Screen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lock Warning if active */}
        {device.isLocked && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Device screen is currently LOCKED by parents. Message displayed: "{device.lockMessage}"</span>
            </div>
            <button 
              onClick={onLockToggle} 
              className="text-xs font-bold text-amber-300 hover:text-white underline ml-2"
            >
              Dismiss Lock
            </button>
          </div>
        )}
      </div>

      {/* Safety Alert Notification if flagged */}
      {flaggedNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Sensitive Content Alert Detected ({flaggedNotifications.length})
              </p>
              <p className="text-xs text-slate-300">
                NotificationListener captured suspicious message: "{flaggedNotifications[0].content.slice(0, 70)}..."
              </p>
            </div>
          </div>
          <button
            id="btn-view-alert-notifs"
            onClick={() => onNavigateTab('notifications')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Review Flagged
          </button>
        </div>
      )}

      {/* 4 Feature Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Remote Live Camera */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all shadow-sm group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" /> Ready
            </span>
          </div>
          <h3 className="font-semibold text-white text-base">Remote Camera</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Stream front or rear camera in real time via P2P WebRTC.
          </p>
          <div className="flex items-center gap-2">
            <button
              id="btn-dash-stream-cam"
              onClick={() => {
                onQuickStream('camera');
                onNavigateTab('livestream');
              }}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition text-center"
            >
              Watch Video
            </button>
            <button
              id="btn-dash-switch-cam"
              onClick={onSwitchCamera}
              title="Toggle Front/Rear"
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition"
            >
              {device.activeCamera === 'front' ? 'Front' : 'Rear'}
            </button>
          </div>
        </div>

        {/* Card 2: Ambient Audio */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 rounded-2xl p-5 transition-all shadow-sm group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {device.ambientNoiseDb} dB Ambient
            </span>
          </div>
          <h3 className="font-semibold text-white text-base">Ambient Audio</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Listen to child environment microphone without ringing phone.
          </p>
          <button
            id="btn-dash-stream-mic"
            onClick={() => {
              onQuickStream('audio');
              onNavigateTab('livestream');
            }}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-xl transition"
          >
            Listen Live
          </button>
        </div>

        {/* Card 3: Screen Mirroring */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-sm group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Cast className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              MediaProjection
            </span>
          </div>
          <h3 className="font-semibold text-white text-base">Live Screen Mirror</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Inspect child screen activity & chats in real time.
          </p>
          <button
            id="btn-dash-stream-screen"
            onClick={() => {
              onQuickStream('screen');
              onNavigateTab('livestream');
            }}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-xl transition"
          >
            Mirror Screen
          </button>
        </div>

        {/* Card 4: Sound Siren */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-sm group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Anti-Loss
            </span>
          </div>
          <h3 className="font-semibold text-white text-base">Sound Alarm Siren</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Play high volume siren even if phone is in silent / vibrate mode.
          </p>
          <button
            id="btn-dash-ring-siren"
            onClick={onPlaySiren}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition"
          >
            Play Loud Siren
          </button>
        </div>
      </div>

      {/* Main Grid: Screen Time & Live Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screen Time & App Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Screen Time Today
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">UsageStatsManager tracking</p>
            </div>
            <button
              onClick={() => onNavigateTab('apps')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Manage Apps <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/40 border border-slate-800 mb-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={percentUsed > 90 ? 'text-red-500' : 'text-indigo-500'}
                  strokeDasharray={`${percentUsed}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-bold text-white">{percentUsed}%</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-slate-400 font-medium">Used:</span>
                <span className="text-sm font-bold text-white">
                  {Math.floor(device.todayScreenTimeUsedMinutes / 60)}h {device.todayScreenTimeUsedMinutes % 60}m
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-slate-400 font-medium">Daily Limit:</span>
                <span className="text-sm font-semibold text-slate-300">
                  {Math.floor(device.dailyScreenTimeLimitMinutes / 60)}h {device.dailyScreenTimeLimitMinutes % 60}m
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {remainingMinutes > 0 ? (
                  <span className="text-emerald-400 font-medium">{remainingHours}h {remainingMinsRem}m left before bedtime lock</span>
                ) : (
                  <span className="text-red-400 font-semibold">Daily allowance reached! Apps are restricted.</span>
                )}
              </p>
            </div>
          </div>

          {/* Top Apps Used */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Apps Used Today</h4>
            {device.apps.slice(0, 4).map((app) => (
              <div key={app.packageName} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 transition border border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{app.name}</span>
                      {app.isBlocked && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-semibold">Blocked</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">{app.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-200">{app.usedMinutesToday} mins</span>
                  <div className="text-[10px] text-slate-400">
                    {app.timeLimitMinutes ? `Limit: ${app.timeLimitMinutes}m` : 'No limit'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live GPS & Geofence Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Real-Time Location & Geofence
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">High-accuracy GPS tracking</p>
              </div>
              <button
                onClick={() => onNavigateTab('location')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Open Full Map <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                      Current Position
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    {device.location.address}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Coordinates: {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)} (Accuracy ±{device.location.accuracy}m)
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Inside Safe Zone
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Current Speed:</span>{' '}
                  <strong className="text-white">{device.location.speedKmh} km/h (Stationary)</strong>
                </div>
                <div>
                  <span className="text-slate-400">Last GPS fix:</span>{' '}
                  <strong className="text-white">Just now</strong>
                </div>
              </div>
            </div>

            {/* Geofences Active */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Geofences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {device.geofences.map(zone => (
                  <div key={zone.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/60 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      zone.type === 'school' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {zone.type === 'school' ? 'SCH' : 'SAFE'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200">{zone.name}</p>
                      <p className="text-[10px] text-slate-400">Radius: {zone.radiusMeters}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('location')}
            className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            Track Live GPS & Route Playback
          </button>
        </div>
      </div>

      {/* Flutter & React Native Native Code Access Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Flutter & React Native Architecture Code</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Access production-ready native services: DeviceAdminReceiver, NotificationListenerService, UsageStatsManager, and MediaProjection WebRTC foreground services.
            </p>
          </div>
        </div>
        <button
          id="btn-open-native-architecture"
          onClick={onOpenCodeModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shrink-0 transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <ExternalLink className="w-4 h-4" />
          View Native Source Code
        </button>
      </div>
    </div>
  );
};
