import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Key, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { ChildDevice } from '../../types';

interface ParentPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: ChildDevice[];
  currentDeviceId: string;
  onSelectDevice: (id: string) => void;
}

export const ParentPairingModal: React.FC<ParentPairingModalProps> = ({
  isOpen,
  onClose,
  devices,
  currentDeviceId,
  onSelectDevice
}) => {
  const [pairingCode, setPairingCode] = useState('739201');
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState(890); // seconds
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const generateNewCode = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/pairing/generate', { method: 'POST' });
      const data = await res.json();
      if (data.code) {
        setPairingCode(data.code);
        setExpiresIn(900);
      }
    } catch {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setPairingCode(randomCode);
      setExpiresIn(900);
    }
    setIsGenerating(false);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <QrCode className="w-6 h-6 text-indigo-400" />
            Child Device Pairing & Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Install Kid Monitor on your child's phone and pair using the QR code or 6-digit passcode.
          </p>
        </div>

        {/* Existing Paired Devices list */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-300 block mb-2">Active Monitored Devices ({devices.length})</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {devices.map(d => (
              <div
                key={d.id}
                onClick={() => onSelectDevice(d.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  d.id === currentDeviceId
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-sm'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {d.childName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{d.name}</h4>
                    <span className="text-[10px] text-emerald-400 font-medium">● Online ({d.batteryLevel}%)</span>
                  </div>
                </div>
                {d.id === currentDeviceId && (
                  <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pairing Code & QR */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-400">
            <Key className="w-4 h-4" />
            <span>Pairing Passcode (Valid for {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')})</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700 shadow-inner">
              {pairingCode}
            </div>
            <button
              onClick={copyCode}
              className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
              title="Copy Code"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          {/* SVG QR Code Simulation */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <svg className="w-36 h-36" viewBox="0 0 100 100">
                {/* Simulated QR Pattern */}
                <rect width="100" height="100" fill="white" />
                {/* Corner markers */}
                <rect x="5" y="5" width="25" height="25" fill="black" />
                <rect x="9" y="9" width="17" height="17" fill="white" />
                <rect x="13" y="13" width="9" height="9" fill="black" />

                <rect x="70" y="5" width="25" height="25" fill="black" />
                <rect x="74" y="9" width="17" height="17" fill="white" />
                <rect x="78" y="13" width="9" height="9" fill="black" />

                <rect x="5" y="70" width="25" height="25" fill="black" />
                <rect x="9" y="74" width="17" height="17" fill="white" />
                <rect x="13" y="78" width="9" height="9" fill="black" />

                {/* Random QR blocks */}
                <rect x="35" y="10" width="8" height="8" fill="black" />
                <rect x="50" y="15" width="8" height="8" fill="black" />
                <rect x="40" y="30" width="16" height="8" fill="black" />
                <rect x="15" y="45" width="12" height="10" fill="black" />
                <rect x="65" y="45" width="20" height="8" fill="black" />
                <rect x="45" y="55" width="10" height="15" fill="black" />
                <rect x="70" y="70" width="15" height="15" fill="black" />
                <rect x="35" y="75" width="12" height="10" fill="black" />
              </svg>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Scan this QR code with the Child Companion App camera
            </p>
          </div>

          <button
            onClick={generateNewCode}
            disabled={isGenerating}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New Passcode
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
