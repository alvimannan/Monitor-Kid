import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Mic, 
  Cast, 
  RotateCw, 
  Camera, 
  Volume2, 
  VolumeX, 
  Eye, 
  Zap, 
  CircleDot, 
  Maximize2, 
  Radio, 
  ShieldCheck, 
  Download,
  AlertCircle
} from 'lucide-react';
import { ChildDevice, StreamMode } from '../../types';
import { mediaSimulator } from '../../services/mediaSimulator';

interface ParentLiveStreamProps {
  device: ChildDevice;
  initialMode?: StreamMode;
  onSwitchCamera: () => void;
}

export const ParentLiveStream: React.FC<ParentLiveStreamProps> = ({
  device,
  initialMode = 'camera',
  onSwitchCamera
}) => {
  const [mode, setMode] = useState<StreamMode>(initialMode);
  const [isNightVision, setIsNightVision] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [ambientDb, setAmbientDb] = useState(device.ambientNoiseDb || 42);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const [realMediaStream, setRealMediaStream] = useState<MediaStream | null>(null);

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Handle stream creation (Simulator or real webcam)
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (useRealWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setRealMediaStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(err => {
          console.warn('Real webcam not accessible, falling back to WebRTC simulator:', err);
          setUseRealWebcam(false);
        });
    } else {
      if (mode === 'camera' || mode === 'screen') {
        activeStream = mediaSimulator.createCameraStream(device.activeCamera, device.childName);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.play().catch(() => {});
        }
      }
    }

    return () => {
      mediaSimulator.stopStream();
      if (realMediaStream) {
        realMediaStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [mode, device.activeCamera, useRealWebcam]);

  // Recording timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Simulate audio ambient dB jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbientDb(prev => {
        const jitter = Math.floor(Math.random() * 9) - 4;
        return Math.max(30, Math.min(85, prev + jitter));
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleTakeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedSnapshot(dataUrl);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stream Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Remote Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming from <strong>{device.name}</strong> • WebRTC P2P Direct Tunnel
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            id="tab-stream-camera"
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Live Camera
          </button>

          <button
            id="tab-stream-audio"
            onClick={() => setMode('audio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'audio'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            Ambient Audio
          </button>

          <button
            id="tab-stream-screen"
            onClick={() => setMode('screen')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === 'screen'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cast className="w-4 h-4" />
            Screen Mirror
          </button>
        </div>
      </div>

      {/* Main Stream Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Canvas / Player (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            {mode === 'camera' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-all ${
                  isNightVision ? 'filter invert hue-rotate-90 brightness-125 contrast-125' : ''
                }`}
              />
            )}

            {mode === 'screen' && (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                {/* Simulated Screen Mirroring View */}
                <div className="w-64 h-full py-3">
                  <div className="w-full h-full rounded-2xl border-4 border-slate-700 bg-slate-900 overflow-hidden relative shadow-2xl flex flex-col justify-between p-3 text-white">
                    {/* Status bar */}
                    <div className="flex justify-between items-center text-[10px] text-slate-300">
                      <span>11:05 AM</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <span>{device.batteryLevel}%</span>
                      </div>
                    </div>

                    {/* Active App Screen */}
                    <div className="my-auto text-center space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/30">
                        {device.currentAppRunning.charAt(0)}
                      </div>
                      <h4 className="text-xs font-bold text-white">{device.currentAppRunning}</h4>
                      <p className="text-[10px] text-slate-400">Child is actively interacting with this app.</p>
                      
                      {device.isLocked ? (
                        <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-[10px] text-red-300">
                          🔒 Screen Locked by Parent
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                          ✓ MediaProjection Active
                        </div>
                      )}
                    </div>

                    {/* Nav bar */}
                    <div className="flex justify-around items-center pt-2 border-t border-slate-800 text-slate-500 text-xs">
                      <span>◀</span>
                      <span>●</span>
                      <span>■</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-cyan-500/30 text-[11px] text-cyan-400 flex items-center gap-2">
                  <Cast className="w-3.5 h-3.5" />
                  MediaProjection API Live Feed
                </div>
              </div>
            )}

            {mode === 'audio' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center">
                <div className="relative mb-6">
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                    ambientDb > 65 
                      ? 'bg-amber-500/20 text-amber-400 ring-8 ring-amber-500/10 animate-pulse' 
                      : 'bg-violet-500/20 text-violet-400 ring-8 ring-violet-500/10'
                  }`}>
                    <Mic className="w-12 h-12" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1">Ambient Audio Stream</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  Listening to ambient environment microphone on {device.childName}'s phone in real time.
                </p>

                {/* Sound Waveform Visualization */}
                <div className="flex items-center gap-1.5 h-16 mb-4">
                  {[40, 65, 30, 80, 50, 90, 75, 45, 60, 85, 35, 70, 55, 95, 60, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-200 ${
                        ambientDb > 60 ? 'bg-amber-400' : 'bg-violet-400'
                      }`}
                      style={{
                        height: `${Math.min(100, Math.max(15, (h * ambientDb) / 60))}%`,
                        opacity: isMuted ? 0.3 : 1
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black tracking-tight">{ambientDb} dB</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {ambientDb < 45 ? 'Quiet (Indoor)' : ambientDb < 65 ? 'Normal Speech' : 'Elevated Noise'}
                  </span>
                </div>
              </div>
            )}

            {/* Overlays / Stream HUD */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs font-semibold text-emerald-400 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE 1080P 30FPS
              </span>

              {isRecording && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600/80 backdrop-blur rounded-full text-xs font-bold text-white animate-pulse">
                  <CircleDot className="w-3.5 h-3.5" />
                  REC {formatTime(recordSeconds)}
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-black/60 backdrop-blur rounded-lg text-[11px] font-mono text-slate-300 border border-white/10">
                P2P Latency: 48ms
              </span>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 inset-x-4 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {mode === 'camera' && (
                  <>
                    <button
                      id="btn-switch-cam-direction"
                      onClick={onSwitchCamera}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition"
                    >
                      <RotateCw className="w-4 h-4" />
                      {device.activeCamera === 'front' ? 'Switch to Rear' : 'Switch to Front'}
                    </button>

                    <button
                      onClick={() => setIsNightVision(!isNightVision)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isNightVision ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Night Vision
                    </button>

                    <button
                      onClick={() => setIsTorchOn(!isTorchOn)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isTorchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Torch
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg text-xs transition ${
                    isMuted ? 'bg-red-500/30 text-red-300' : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {mode === 'camera' && (
                  <button
                    id="btn-take-snapshot"
                    onClick={handleTakeSnapshot}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow"
                  >
                    <Camera className="w-4 h-4" />
                    Snapshot
                  </button>
                )}

                <button
                  id="btn-toggle-record"
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isRecording 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  <CircleDot className="w-4 h-4" />
                  {isRecording ? 'Stop Recording' : 'Record'}
                </button>
              </div>
            </div>
          </div>

          {/* Real Webcam toggle helper for tester */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              WebRTC direct stream active using synthetic high-fidelity 1080p camera renderer.
            </span>
            <button
              onClick={() => setUseRealWebcam(!useRealWebcam)}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              {useRealWebcam ? 'Use Virtual Feed' : 'Test With Real Camera'}
            </button>
          </div>
        </div>

        {/* Right Column: Stream Telemetry & Snapshots */}
        <div className="space-y-4">
          {/* Stream Diagnostics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Stream Diagnostics & Security
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Stream Source:</span>
                <strong className="text-slate-200">{device.model}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Active Camera Lens:</span>
                <strong className="text-indigo-300 uppercase">{device.activeCamera} (f/1.8)</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Resolution:</span>
                <span className="text-emerald-400 font-semibold">1920 x 1080 (FHD)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Signaling Protocol:</span>
                <span className="text-slate-200 font-mono">WebSocket / SDP ICE</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Encryption:</span>
                <span className="text-emerald-400 font-medium">DTLS-SRTP 256-bit</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Child Notification:</span>
                <span className="text-slate-300">Foreground Service Icon</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Android 14 requires a persistent foreground service with type <code className="text-indigo-300">mediaProjection</code> and <code className="text-indigo-300">camera</code> when streaming.
              </span>
            </div>
          </div>

          {/* Captured Snapshot Gallery */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <h4 className="text-sm font-bold mb-3 flex items-center justify-between">
              <span>Recent Snapshot</span>
              {capturedSnapshot && (
                <span className="text-[10px] text-emerald-400 font-semibold">Saved to Parent Cloud</span>
              )}
            </h4>

            {capturedSnapshot ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-slate-700 aspect-video relative group">
                  <img src={capturedSnapshot} alt="Child camera snapshot" className="w-full h-full object-cover" />
                  <a
                    href={capturedSnapshot}
                    download={`snapshot-${device.childName}-${Date.now()}.png`}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs font-bold text-white"
                  >
                    <Download className="w-4 h-4" /> Download Photo
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">Captured at {new Date().toLocaleTimeString()}</p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Click "Snapshot" during camera stream to capture photo evidence.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
