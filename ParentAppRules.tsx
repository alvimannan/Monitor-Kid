import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Ban, 
  CheckCircle, 
  Search, 
  Moon, 
  Lock, 
  Unlock, 
  Sliders, 
  Smartphone, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ChildDevice, AppRule } from '../../types';

interface ParentAppRulesProps {
  device: ChildDevice;
  onToggleBlockApp: (packageName: string, isBlocked: boolean) => void;
  onSetAppTimeLimit: (packageName: string, limitMinutes: number) => void;
  onSetDailyScreenLimit: (limitMinutes: number) => void;
  onLockDevice: (message?: string) => void;
  onUnlockDevice: () => void;
}

export const ParentAppRules: React.FC<ParentAppRulesProps> = ({
  device,
  onToggleBlockApp,
  onSetAppTimeLimit,
  onSetDailyScreenLimit,
  onLockDevice,
  onUnlockDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lockCustomMessage, setLockCustomMessage] = useState('Time for dinner and homework! Device locked.');
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [bedtimeEnabled, setBedtimeEnabled] = useState(true);
  const [bedtimeStart, setBedtimeStart] = useState('21:00');
  const [bedtimeEnd, setBedtimeEnd] = useState('07:00');

  const filteredApps = device.apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const blockedCount = device.apps.filter(a => a.isBlocked).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Rules Header & Instant Lockdown Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            App Management & Restrictions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enforced natively via Android <strong>UsageStatsManager</strong> & <strong>DevicePolicyManager</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {device.isLocked ? (
            <button
              id="btn-unlock-device-rules"
              onClick={onUnlockDevice}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition"
            >
              <Unlock className="w-4 h-4" />
              Unlock Device
            </button>
          ) : (
            <button
              id="btn-lock-device-rules"
              onClick={() => setShowLockPrompt(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg transition"
            >
              <Lock className="w-4 h-4" />
              Lock Screen Now
            </button>
          )}
        </div>
      </div>

      {/* Screen Time & Bedtime Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Daily Screen Time Limit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Daily Total Screen Allowance
            </h3>
            <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {Math.floor(device.dailyScreenTimeLimitMinutes / 60)}h {device.dailyScreenTimeLimitMinutes % 60}m
            </span>
          </div>

          <p className="text-xs text-slate-400">
            When this allowance runs out, non-essential apps will be locked automatically until midnight.
          </p>

          <input
            type="range"
            min="30"
            max="360"
            step="15"
            value={device.dailyScreenTimeLimitMinutes}
            onChange={(e) => onSetDailyScreenLimit(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>30m (Strict)</span>
            <span>2h 30m</span>
            <span>6h (Relaxed)</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
            <span className="text-slate-400">Used today:</span>
            <strong className="text-slate-200">
              {Math.floor(device.todayScreenTimeUsedMinutes / 60)}h {device.todayScreenTimeUsedMinutes % 60}m
            </strong>
          </div>
        </div>

        {/* Bedtime Curfew Schedule */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Moon className="w-4 h-4 text-violet-400" />
              Bedtime Curfew Lockout
            </h3>
            <button
              onClick={() => setBedtimeEnabled(!bedtimeEnabled)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                bedtimeEnabled ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {bedtimeEnabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Shuts down entertainment and social apps during night hours. Phone calls to parents remain unlocked.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Lockout Starts</label>
              <input
                type="time"
                value={bedtimeStart}
                onChange={(e) => setBedtimeStart(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Unlocks Next Morning</label>
              <input
                type="time"
                value={bedtimeEnd}
                onChange={(e) => setBedtimeEnd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-violet-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Encourages healthy sleep habits automatically every night.</span>
          </div>
        </div>
      </div>

      {/* Installed Apps List & Blocking Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              Installed Applications ({device.apps.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {blockedCount} app{blockedCount === 1 ? '' : 's'} currently blocked remotely
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search apps by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'social', 'games', 'video', 'chat', 'educational'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Table / Cards */}
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {filteredApps.map(app => (
            <div
              key={app.packageName}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                app.isBlocked ? 'bg-red-950/20' : 'bg-slate-900/60 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  app.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {app.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{app.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
                      {app.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{app.packageName}</p>
                </div>
              </div>

              {/* Usage & Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">
                    {app.usedMinutesToday} mins used today
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {app.timeLimitMinutes > 0 ? `Limit: ${app.timeLimitMinutes} min/day` : 'No app limit'}
                  </div>
                </div>

                {/* App Time Limit Selector */}
                <select
                  value={app.timeLimitMinutes}
                  onChange={(e) => onSetAppTimeLimit(app.packageName, Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={0}>Unlimited</option>
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>

                {/* Block / Unblock Toggle Button */}
                <button
                  id={`btn-block-${app.packageName}`}
                  onClick={() => onToggleBlockApp(app.packageName, !app.isBlocked)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                    app.isBlocked
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {app.isBlocked ? (
                    <>
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      Blocked
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Allowed
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lock Screen Custom Prompt Modal */}
      {showLockPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
              <Lock className="w-5 h-5" />
              Lock Child Device Screen
            </h3>
            <p className="text-xs text-slate-400">
              Sends an immediate DeviceAdmin broadcast to lock the phone screen and display your custom message.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Takeover Message on Child Screen</label>
              <textarea
                rows={3}
                value={lockCustomMessage}
                onChange={(e) => setLockCustomMessage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLockPrompt(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onLockDevice(lockCustomMessage);
                  setShowLockPrompt(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                Lock Device Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
