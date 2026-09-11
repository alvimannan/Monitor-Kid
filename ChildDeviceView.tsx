import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Battery, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Smartphone, 
  Send, 
  Play, 
  Volume2, 
  Radio,
  ChevronRight,
  PhoneCall,
  KeyRound
} from 'lucide-react';
import { ChildDevice } from '../../types';

interface ChildDeviceViewProps {
  device: ChildDevice;
  onSosTrigger: () => void;
  onSimulateAppOpen: (appName: string) => void;
  onSimulateIncomingNotif: (appName: string, message: string) => void;
  onPairCodeSubmit?: (code: string) => void;
}

export const ChildDeviceView: React.FC<ChildDeviceViewProps> = ({
  device,
  onSosTrigger,
  onSimulateAppOpen,
  onSimulateIncomingNotif,
  onPairCodeSubmit
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'permissions' | 'pair'>('home');
  const [sosHolding, setSosHolding] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [openedApp, setOpenedApp] = useState<string | null>(null);
  const [appBlockedOverlay, setAppBlockedOverlay] = useState<string | null>(null);
  const [pairCodeInput, setPairCodeInput] = useState('');

  // SOS Hold timer
  useEffect(() => {
    let interval: any = null;
    if (sosHolding) {
      interval = setInterval(() => {
        setSosProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            onSosTrigger();
            setSosHolding(false);
            return 0;
          }
          return p + 10;
        });
      }, 100);
    } else {
      setSosProgress(0);
    }
    return () => clearInterval(interval);
  }, [sosHolding, onSosTrigger]);

  const handleOpenApp = (appName: string, isBlocked: boolean) => {
    if (device.isLocked) {
      return; // Device locked completely
    }

    if (isBlocked) {
      setAppBlockedOverlay(appName);
      return;
    }

    setOpenedApp(appName);
    onSimulateAppOpen(appName);
  };

  const remainingMinutes = Math.max(0, device.dailyScreenTimeLimitMinutes - device.todayScreenTimeUsedMinutes);

  return (
    <div className="flex justify-center p-2 sm:p-6">
      {/* Mobile Device Frame Mockup */}
      <div className="w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[44px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative text-white">
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center items-center z-50 pointer-events-none">
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-500/40" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 pt-3 pb-2 flex justify-between items-center text-[11px] font-semibold text-slate-300 z-40 bg-slate-950">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">5G</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px]">{device.batteryLevel}%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Device Lock Screen Takeover (if parent locked device) */}
        {device.isLocked ? (
          <div className="flex-1 bg-red-950/95 flex flex-col items-center justify-between p-6 text-center z-40 animate-fade-in">
            <div className="pt-10">
              <div className="w-20 h-20 rounded-3xl bg-red-600/30 border-2 border-red-500/60 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-xl">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Device Locked</h2>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">
                Controlled by Parent
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-red-500/30 text-xs text-red-200 leading-relaxed max-w-xs">
              "{device.lockMessage || 'Your phone is currently locked by parents. Please finish your chores or homework.'}"
            </div>

            <div className="w-full space-y-3 pb-4">
              <button
                onClick={() => alert('Dialing Mother / Father Emergency Line...')}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneCall className="w-4 h-4" />
                Emergency Call to Parents
              </button>
              <p className="text-[10px] text-slate-400">
                All apps are restricted while device is locked.
              </p>
            </div>
          </div>
        ) : appBlockedOverlay ? (
          /* App Blocked Modal */
          <div className="flex-1 bg-slate-950/95 flex flex-col items-center justify-between p-6 text-center z-40">
            <div className="pt-12">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">{appBlockedOverlay} is Blocked</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Your parents have restricted access to this app for today.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              Daily time limit or parental block enforced via Kid Monitor Device Admin.
            </div>

            <button
              onClick={() => setAppBlockedOverlay(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition"
            >
              Back to Home
            </button>
          </div>
        ) : openedApp ? (
          /* Simulated App Sandbox */
          <div className="flex-1 bg-slate-900 flex flex-col justify-between p-4 z-40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
                  {openedApp.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{openedApp}</h4>
                  <span className="text-[10px] text-emerald-400">Active • Screen Time Counting</span>
                </div>
              </div>
              <button
                onClick={() => setOpenedApp(null)}
                className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                Exit App
              </button>
            </div>

            <div className="my-auto text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Play className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Using {openedApp}</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                The parent dashboard tracks your usage in real-time through the UsageStatsManager service.
              </p>
            </div>

            <div className="text-center text-[10px] text-slate-500">
              Kid Monitor Background Service is active.
            </div>
          </div>
        ) : (
          /* Main Child Companion UI */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-between">
            <div>
              {/* Header Tab Navigator */}
              <div className="flex justify-between items-center p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-4">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'home' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Protection
                </button>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab('pair')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'pair' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Pairing
                </button>
              </div>

              {activeTab === 'home' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Kid Monitor Protected</h3>
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Background Services Active
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Device: {device.childName}</p>
                    </div>
                  </div>

                  {/* Daily Screen Time Allowance */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-400">Screen Time Remaining Today</span>
                      <strong className="text-indigo-400 font-bold">
                        {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
                      </strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (device.todayScreenTimeUsedMinutes / device.dailyScreenTimeLimitMinutes) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Interactive App Sandbox */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="font-semibold uppercase text-[10px] tracking-wider">Installed Apps</span>
                      <span>Tap to launch</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      {device.apps.slice(0, 8).map(app => (
                        <button
                          key={app.packageName}
                          onClick={() => handleOpenApp(app.name, app.isBlocked)}
                          className="flex flex-col items-center gap-1 group relative p-1"
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md transition-all group-hover:scale-105 ${
                            app.isBlocked ? 'bg-red-950 border border-red-500/40 text-red-400 opacity-60' : 'bg-slate-800 border border-slate-700 text-indigo-300'
                          }`}>
                            {app.name.charAt(0)}
                            {app.isBlocked && (
                              <Lock className="w-3.5 h-3.5 absolute -top-1 -right-1 text-red-400 bg-slate-950 rounded-full p-0.5" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-300 font-medium truncate max-w-[58px]">
                            {app.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Incoming Notification Trigger */}
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Simulate Incoming Alert
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSimulateIncomingNotif('WhatsApp', 'Hey Liam! Ready to go to soccer practice?')}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] text-slate-300 transition"
                      >
                        WhatsApp Msg
                      </button>
                      <button
                        onClick={() => onSimulateIncomingNotif('Instagram', 'Alex sent you a secret DM!')}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] text-slate-300 transition"
                      >
                        Flagged Alert
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                /* Native Permissions Onboarding List */
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200">Required Native Background Permissions</h4>
                  <p className="text-[11px] text-slate-400">
                    Kid Monitor requires these 6 background capabilities to operate safely:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">1. Device Admin</p>
                        <p className="text-[10px] text-slate-400">Prevents uninstall & allows remote lock</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">2. UsageStatsManager</p>
                        <p className="text-[10px] text-slate-400">Tracks app screen time & limits</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">3. NotificationListener</p>
                        <p className="text-[10px] text-slate-400">Captures incoming messages</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">4. MediaProjection API</p>
                        <p className="text-[10px] text-slate-400">Real-time screen mirroring</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">5. Background Location</p>
                        <p className="text-[10px] text-slate-400">High-accuracy GPS always allowed</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">6. Camera & Microphone</p>
                        <p className="text-[10px] text-slate-400">Direct WebRTC ambient streaming</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pair' && (
                /* Pairing Screen */
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-center">
                  <KeyRound className="w-8 h-8 text-indigo-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Pair with Parent App</h4>
                  <p className="text-xs text-slate-400">
                    Enter the 6-digit code shown on your Parent's dashboard.
                  </p>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 739201"
                    value={pairCodeInput}
                    onChange={(e) => setPairCodeInput(e.target.value)}
                    className="w-full text-center tracking-widest text-2xl font-mono py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    onClick={() => {
                      if (onPairCodeSubmit && pairCodeInput.length === 6) {
                        onPairCodeSubmit(pairCodeInput);
                      }
                    }}
                    disabled={pairCodeInput.length !== 6}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Connect Device
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Emergency SOS Trigger Button */}
            <div className="pt-2">
              <div className="relative">
                <button
                  onMouseDown={() => setSosHolding(true)}
                  onMouseUp={() => setSosHolding(false)}
                  onTouchStart={() => setSosHolding(true)}
                  onTouchEnd={() => setSosHolding(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-sm tracking-wide shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 select-none relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 bg-red-400/40 transition-all duration-100 pointer-events-none"
                    style={{ width: `${sosProgress}%` }}
                  />
                  <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
                  <span>{sosHolding ? `HOLDING... ${sosProgress}%` : 'HOLD 3 SEC FOR EMERGENCY SOS'}</span>
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-1.5">
                Instantly notifies parents with your live GPS location and sounds an alert.
              </p>
            </div>
          </div>
        )}

        {/* Device Bottom Home Bar Indicator */}
        <div className="pb-2 pt-1 flex justify-center bg-slate-950">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
