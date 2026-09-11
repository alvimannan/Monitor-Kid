import React from 'react';
import { 
  Shield, 
  Smartphone, 
  Users, 
  Columns, 
  QrCode, 
  Cpu, 
  Radio, 
  Wifi,
  ChevronDown
} from 'lucide-react';
import { AppMode, ChildDevice } from '../types';

interface NavbarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  devices: ChildDevice[];
  currentDeviceId: string;
  onSelectDevice: (id: string) => void;
  onOpenPairing: () => void;
  onOpenCodeModal: () => void;
  isWsConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onModeChange,
  devices,
  currentDeviceId,
  onSelectDevice,
  onOpenPairing,
  onOpenCodeModal,
  isWsConnected
}) => {
  const currentDevice = devices.find(d => d.id === currentDeviceId) || devices[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">Kid Monitor</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Cross-Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Parental Control & Safety Ecosystem</p>
            </div>
          </div>

          {/* WebSocket Live Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {isWsConnected ? 'WebSocket P2P Active' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Center: Device Selector (for Parent view) */}
        <div className="flex items-center gap-2">
          {devices.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={currentDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.name} ({d.batteryLevel}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="btn-nav-pair-device"
            onClick={onOpenPairing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-medium transition"
            title="Pair new child device"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pair Device</span>
          </button>
        </div>

        {/* Right: Mode Switcher (Parent / Child / Dual Split Simulator) & Code Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              id="mode-parent-btn"
              onClick={() => onModeChange('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                mode === 'parent' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Parent Mode
            </button>

            <button
              id="mode-child-btn"
              onClick={() => onModeChange('child')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                mode === 'child' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Child Mode
            </button>

            <button
              id="mode-split-btn"
              onClick={() => onModeChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                mode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Test Parent & Child side-by-side in real-time"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dual Simulator</span>
              <span className="sm:hidden">Dual</span>
            </button>
          </div>

          <button
            id="btn-nav-code-modal"
            onClick={onOpenCodeModal}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 rounded-xl transition"
            title="Flutter & React Native Architecture Code"
          >
            <Cpu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
