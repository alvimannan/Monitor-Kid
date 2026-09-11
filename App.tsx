import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { ParentDashboard } from './parent/ParentDashboard';
import { ParentLiveStream } from './parent/ParentLiveStream';
import { ParentLocationMap } from './parent/ParentLocationMap';
import { ParentAppRules } from './parent/ParentAppRules';
import { ParentNotifications } from './parent/ParentNotifications';
import { ParentTabBar } from './parent/ParentTabBar';
import { ParentPairingModal } from './parent/ParentPairingModal';
import { ChildDeviceView } from './child/ChildDeviceView';
import { SosAlertBanner } from './modals/SosAlertBanner';
import { NativeCodeModal } from './modals/NativeCodeModal';
import { wsService } from './services/websocket';
import { soundEffects } from './services/soundEffects';
import { ChildDevice, ActiveTab, AppMode, StreamMode, GeofenceZone, NotificationItem } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('parent');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [devices, setDevices] = useState<ChildDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('child-device-1');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [streamInitialMode, setStreamInitialMode] = useState<StreamMode>('camera');

  // Modals & Banners
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isNativeCodeModalOpen, setIsNativeCodeModalOpen] = useState(false);
  const [sosAlert, setSosAlert] = useState<{
    childName: string;
    location?: { address: string; latitude: number; longitude: number };
    battery?: number;
    timestamp: number;
  } | null>(null);

  // Initialize and connect to server
  useEffect(() => {
    // Fetch initial devices from REST
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDevices(data);
          if (!currentDeviceId) setCurrentDeviceId(data[0].id);
        }
      })
      .catch(err => console.warn('Failed to fetch devices:', err));

    // Connect WebSocket
    wsService.connect('parent', currentDeviceId);
    setIsWsConnected(true);

    const unsubscribe = wsService.subscribe((data) => {
      if (data.type === 'initial_state' && Array.isArray(data.devices)) {
        setDevices(data.devices);
        if (data.devices.length > 0 && !currentDeviceId) {
          setCurrentDeviceId(data.devices[0].id);
        }
      } else if (data.type === 'device_updated' && data.device) {
        setDevices(prev => prev.map(d => d.id === data.device.id ? data.device : d));
      } else if (data.type === 'device_paired' && data.device) {
        setDevices(prev => [...prev, data.device]);
        setCurrentDeviceId(data.device.id);
      } else if (data.type === 'new_notification' && data.notification) {
        soundEffects.playNotificationBeep();
        setDevices(prev => prev.map(d => {
          if (d.id === data.deviceId) {
            return {
              ...d,
              notifications: [data.notification, ...d.notifications]
            };
          }
          return d;
        }));
      } else if (data.type === 'location_updated' && data.location) {
        setDevices(prev => prev.map(d => {
          if (d.id === data.deviceId) {
            return {
              ...d,
              location: { ...d.location, ...data.location }
            };
          }
          return d;
        }));
      } else if (data.type === 'sos_alert_received') {
        soundEffects.playEmergencyAlarm();
        setSosAlert({
          childName: data.childName || 'Child',
          location: data.location,
          battery: data.battery,
          timestamp: data.timestamp || Date.now()
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const currentDevice = devices.find(d => d.id === currentDeviceId) || devices[0];

  // Actions
  const handleLockToggle = () => {
    if (!currentDevice) return;
    const action = currentDevice.isLocked ? 'unlock' : 'lock';
    wsService.sendCommand(currentDevice.id, action);
    setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, isLocked: !d.isLocked } : d));
  };

  const handleSwitchCamera = () => {
    if (!currentDevice) return;
    const nextCam = currentDevice.activeCamera === 'front' ? 'rear' : 'front';
    wsService.sendCommand(currentDevice.id, 'switch_camera');
    setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, activeCamera: nextCam } : d));
  };

  const handlePlaySiren = () => {
    soundEffects.playSiren(4000);
    alert(`📢 High volume anti-loss alarm triggered on ${currentDevice?.name || 'child phone'}!`);
  };

  const handleToggleBlockApp = (packageName: string, isBlocked: boolean) => {
    if (!currentDevice) return;
    const action = isBlocked ? 'block_app' : 'unblock_app';
    wsService.sendCommand(currentDevice.id, action, { packageName });
    setDevices(prev => prev.map(d => {
      if (d.id === currentDevice.id) {
        return {
          ...d,
          apps: d.apps.map(a => a.packageName === packageName ? { ...a, isBlocked } : a)
        };
      }
      return d;
    }));
  };

  const handleSetAppTimeLimit = (packageName: string, limitMinutes: number) => {
    if (!currentDevice) return;
    wsService.sendCommand(currentDevice.id, 'set_app_limit', { packageName, limitMinutes });
    setDevices(prev => prev.map(d => {
      if (d.id === currentDevice.id) {
        return {
          ...d,
          apps: d.apps.map(a => a.packageName === packageName ? { ...a, timeLimitMinutes: limitMinutes } : a)
        };
      }
      return d;
    }));
  };

  const handleSetDailyScreenLimit = (limitMinutes: number) => {
    if (!currentDevice) return;
    wsService.sendCommand(currentDevice.id, 'set_screen_limit', { limitMinutes });
    setDevices(prev => prev.map(d => {
      if (d.id === currentDevice.id) {
        return { ...d, dailyScreenTimeLimitMinutes: limitMinutes };
      }
      return d;
    }));
  };

  const handleRefreshGps = () => {
    if (!currentDevice) return;
    // Simulate real GPS jitter update
    const latDelta = (Math.random() - 0.5) * 0.001;
    const lngDelta = (Math.random() - 0.5) * 0.001;
    const newLocation = {
      latitude: currentDevice.location.latitude + latDelta,
      longitude: currentDevice.location.longitude + lngDelta,
      accuracy: 6,
      address: currentDevice.location.address,
      speedKmh: 0,
      timestamp: Date.now()
    };
    wsService.sendLocation(currentDevice.id, newLocation);
  };

  const handleAddGeofence = (zone: Omit<GeofenceZone, 'id'>) => {
    if (!currentDevice) return;
    const newZone: GeofenceZone = {
      ...zone,
      id: `gf-${Date.now()}`
    };
    setDevices(prev => prev.map(d => {
      if (d.id === currentDevice.id) {
        return { ...d, geofences: [...d.geofences, newZone] };
      }
      return d;
    }));
  };

  const handleSendSimulatedNotification = (notif: Partial<NotificationItem>) => {
    if (!currentDevice) return;
    wsService.sendNotification(currentDevice.id, notif);
  };

  const handleChildSos = () => {
    if (!currentDevice) return;
    wsService.sendSos(currentDevice.id);
  };

  const handlePairCodeSubmit = async (code: string) => {
    try {
      const res = await fetch('/api/pairing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          childName: 'New Child Device',
          model: 'Google Pixel 8',
          platform: 'android'
        })
      });
      const data = await res.json();
      if (data.success && data.device) {
        setDevices(prev => [...prev, data.device]);
        setCurrentDeviceId(data.device.id);
        alert('🎉 Child device paired successfully with Parent account!');
      } else {
        alert(data.error || 'Pairing failed. Check 6-digit code.');
      }
    } catch (err) {
      alert('Network error attempting to pair device.');
    }
  };

  const handleSimulateAppOpen = (appName: string) => {
    if (!currentDevice) return;
    setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, currentAppRunning: appName } : d));
  };

  const flaggedCount = currentDevice ? currentDevice.notifications.filter(n => n.isFlagged).length : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        mode={mode}
        onModeChange={setMode}
        devices={devices}
        currentDeviceId={currentDeviceId}
        onSelectDevice={setCurrentDeviceId}
        onOpenPairing={() => setIsPairingModalOpen(true)}
        onOpenCodeModal={() => setIsNativeCodeModalOpen(true)}
        isWsConnected={isWsConnected}
      />

      {/* Emergency SOS Banner */}
      <SosAlertBanner
        alert={sosAlert}
        onDismiss={() => setSosAlert(null)}
        onNavigateTab={(tab) => {
          setMode('parent');
          setActiveTab(tab);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {mode === 'parent' && currentDevice && (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <ParentDashboard
                device={currentDevice}
                onNavigateTab={setActiveTab}
                onLockToggle={handleLockToggle}
                onQuickStream={(sMode) => {
                  setStreamInitialMode(sMode);
                  setActiveTab('livestream');
                }}
                onPlaySiren={handlePlaySiren}
                onSwitchCamera={handleSwitchCamera}
                onOpenCodeModal={() => setIsNativeCodeModalOpen(true)}
              />
            )}

            {activeTab === 'livestream' && (
              <ParentLiveStream
                device={currentDevice}
                initialMode={streamInitialMode}
                onSwitchCamera={handleSwitchCamera}
              />
            )}

            {activeTab === 'location' && (
              <ParentLocationMap
                device={currentDevice}
                onRefreshGps={handleRefreshGps}
                onAddGeofence={handleAddGeofence}
              />
            )}

            {activeTab === 'apps' && (
              <ParentAppRules
                device={currentDevice}
                onToggleBlockApp={handleToggleBlockApp}
                onSetAppTimeLimit={handleSetAppTimeLimit}
                onSetDailyScreenLimit={handleSetDailyScreenLimit}
                onLockDevice={(msg) => {
                  wsService.sendCommand(currentDevice.id, 'lock', { message: msg });
                  setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, isLocked: true, lockMessage: msg } : d));
                }}
                onUnlockDevice={handleLockToggle}
              />
            )}

            {activeTab === 'notifications' && (
              <ParentNotifications
                device={currentDevice}
                onSendSimulatedNotification={handleSendSimulatedNotification}
              />
            )}

            {/* Bottom Tab Bar for Parent App */}
            <ParentTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              flaggedCount={flaggedCount}
            />
          </div>
        )}

        {mode === 'child' && currentDevice && (
          <div className="animate-fade-in flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-full">
                Child Device Simulator: {currentDevice.name}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Simulates the background companion app running on the child's phone.
              </p>
            </div>

            <ChildDeviceView
              device={currentDevice}
              onSosTrigger={handleChildSos}
              onSimulateAppOpen={handleSimulateAppOpen}
              onSimulateIncomingNotif={(appName, message) => {
                handleSendSimulatedNotification({
                  appName,
                  title: 'New Message',
                  content: message,
                  category: 'message'
                });
              }}
              onPairCodeSubmit={handlePairCodeSubmit}
            />
          </div>
        )}

        {mode === 'split' && currentDevice && (
          <div className="animate-fade-in">
            <div className="p-4 mb-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
              <div>
                <strong className="text-white font-bold">Dual Screen Real-Time Simulator:</strong> Test Parent control and Child phone side-by-side! Click "Lock Screen" or "Block App" on the left and observe the child device lock instantly on the right.
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-emerald-400">
                P2P WebSocket Live
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Parent Dashboard (7 cols) */}
              <div className="xl:col-span-7 space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">Parent Controller Dashboard</h3>
                  <div className="flex gap-2">
                    {(['dashboard', 'livestream', 'location', 'apps', 'notifications'] as ActiveTab[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                          activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'dashboard' && (
                  <ParentDashboard
                    device={currentDevice}
                    onNavigateTab={setActiveTab}
                    onLockToggle={handleLockToggle}
                    onQuickStream={(sMode) => {
                      setStreamInitialMode(sMode);
                      setActiveTab('livestream');
                    }}
                    onPlaySiren={handlePlaySiren}
                    onSwitchCamera={handleSwitchCamera}
                    onOpenCodeModal={() => setIsNativeCodeModalOpen(true)}
                  />
                )}

                {activeTab === 'livestream' && (
                  <ParentLiveStream
                    device={currentDevice}
                    initialMode={streamInitialMode}
                    onSwitchCamera={handleSwitchCamera}
                  />
                )}

                {activeTab === 'location' && (
                  <ParentLocationMap
                    device={currentDevice}
                    onRefreshGps={handleRefreshGps}
                    onAddGeofence={handleAddGeofence}
                  />
                )}

                {activeTab === 'apps' && (
                  <ParentAppRules
                    device={currentDevice}
                    onToggleBlockApp={handleToggleBlockApp}
                    onSetAppTimeLimit={handleSetAppTimeLimit}
                    onSetDailyScreenLimit={handleSetDailyScreenLimit}
                    onLockDevice={(msg) => {
                      wsService.sendCommand(currentDevice.id, 'lock', { message: msg });
                      setDevices(prev => prev.map(d => d.id === currentDevice.id ? { ...d, isLocked: true, lockMessage: msg } : d));
                    }}
                    onUnlockDevice={handleLockToggle}
                  />
                )}

                {activeTab === 'notifications' && (
                  <ParentNotifications
                    device={currentDevice}
                    onSendSimulatedNotification={handleSendSimulatedNotification}
                  />
                )}
              </div>

              {/* Right Column: Child Phone Simulator (5 cols) */}
              <div className="xl:col-span-5 flex flex-col items-center">
                <div className="w-full border-b border-slate-800 pb-3 mb-4 text-center">
                  <h3 className="font-bold text-base text-white">Child Companion Phone ({currentDevice.name})</h3>
                  <p className="text-[11px] text-slate-400">Live reflection of background daemon</p>
                </div>

                <ChildDeviceView
                  device={currentDevice}
                  onSosTrigger={handleChildSos}
                  onSimulateAppOpen={handleSimulateAppOpen}
                  onSimulateIncomingNotif={(appName, message) => {
                    handleSendSimulatedNotification({
                      appName,
                      title: 'New Message',
                      content: message,
                      category: 'message'
                    });
                  }}
                  onPairCodeSubmit={handlePairCodeSubmit}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pairing Modal */}
      <ParentPairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        devices={devices}
        currentDeviceId={currentDeviceId}
        onSelectDevice={(id) => {
          setCurrentDeviceId(id);
          setIsPairingModalOpen(false);
        }}
      />

      {/* Flutter / React Native Native Code Architecture Modal */}
      <NativeCodeModal
        isOpen={isNativeCodeModalOpen}
        onClose={() => setIsNativeCodeModalOpen(false)}
      />
    </div>
  );
}
