import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  Sparkles, 
  Cpu, 
  ExternalLink,
  X 
} from 'lucide-react';

interface NativeCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const codeSnippets = {
  notificationListener: {
    title: 'Android NotificationListenerService (Kotlin)',
    filename: 'KidNotificationListenerService.kt',
    lang: 'kotlin',
    code: `package com.kidmonitor.child.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Intent
import org.json.JSONObject

class KidNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        sbn ?: return

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val packageName = sbn.packageName

        // Ignore our own notifications
        if (packageName == applicationContext.packageName) return

        val payload = JSONObject().apply {
            put("packageName", packageName)
            put("title", title)
            put("content", text)
            put("timestamp", sbn.postTime)
            put("category", sbn.notification.category ?: "message")
        }

        // Broadcast to Flutter MethodChannel / React Native Headless JS
        val intent = Intent("com.kidmonitor.NOTIFICATION_CAPTURED").apply {
            putExtra("payload", payload.toString())
        }
        sendBroadcast(intent)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }
}`
  },
  deviceAdmin: {
    title: 'Android DevicePolicyManager & DeviceAdmin (Kotlin)',
    filename: 'KidDeviceAdminReceiver.kt',
    lang: 'kotlin',
    code: `package com.kidmonitor.child.receiver

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class KidDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        // Device Admin granted: Device can now be locked remotely & prevents silent uninstall
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "Warning: Disabling Device Admin will notify parents and disable Kid Monitor safety protection."
    }

    companion object {
        fun lockDeviceNow(context: Context) {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val compName = ComponentName(context, KidDeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(compName)) {
                dpm.lockNow()
            }
        }
    }
}`
  },
  usageStats: {
    title: 'Android UsageStatsManager & App Blocking Overlay (Kotlin)',
    filename: 'KidUsageStatsService.kt',
    lang: 'kotlin',
    code: `package com.kidmonitor.child.services

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import com.kidmonitor.child.ui.BlockOverlayActivity

class KidUsageStatsHelper(private val context: Context) {

    private val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    fun getForegroundApp(): String? {
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 1000 * 10 // Past 10 seconds
        val usageEvents = usageStatsManager.queryEvents(beginTime, endTime)
        var lastForegroundPackage: String? = null

        val event = android.app.usage.UsageEvents.Event()
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
                lastForegroundPackage = event.packageName
            }
        }
        return lastForegroundPackage
    }

    fun enforceAppLimit(packageName: String, isBlocked: Boolean) {
        if (isBlocked && getForegroundApp() == packageName) {
            val intent = Intent(context, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                putExtra("blocked_pkg", packageName)
            }
            context.startActivity(intent)
        }
    }
}`
  },
  mediaProjection: {
    title: 'Android MediaProjection & WebRTC Streamer (Foreground Service)',
    filename: 'KidMediaProjectionService.kt',
    lang: 'kotlin',
    code: `package com.kidmonitor.child.services

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.IBinder
import androidx.core.app.NotificationCompat

class KidMediaProjectionService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        
        // Android 14 requires FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
        startForeground(
            101, 
            notification, 
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
        )

        // Initialize WebRTC Screen Capturer with result data
        val resultCode = intent?.getIntExtra("resultCode", 0) ?: 0
        val resultData = intent?.getParcelableExtra<Intent>("resultData")

        if (resultData != null) {
            val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)
            // Stream frames to WebRTC VideoTrack...
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "kid_monitor_bg")
            .setContentTitle("Kid Monitor Protection Active")
            .setContentText("Child device safety and screen protection is running")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
    }
}`
  },
  flutterBridge: {
    title: 'Flutter Cross-Platform MethodChannel Architecture (Dart)',
    filename: 'main.dart',
    lang: 'dart',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

void main() {
  runApp(const KidMonitorApp());
}

class KidMonitorApp extends StatefulWidget {
  const KidMonitorApp({super.key});

  @override
  State<KidMonitorApp> createState() => _KidMonitorAppState();
}

class _KidMonitorAppState extends State<KidMonitorApp> {
  static const platform = MethodChannel('com.kidmonitor/native_bridge');
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;

  @override
  void initState() {
    super.initState();
    _setupMethodCallHandler();
  }

  void _setupMethodCallHandler() {
    platform.setMethodCallHandler((call) async {
      switch (call.method) {
        case 'onRemoteLock':
          _showLockScreen(call.arguments['message']);
          break;
        case 'onStartWebRTCStream':
          _startWebRtcStream(call.arguments['camera']); // 'front' or 'rear'
          break;
        case 'onAppLimitExceeded':
          _blockApp(call.arguments['package']);
          break;
      }
    });
  }

  Future<void> _startWebRtcStream(String camera) async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': true,
      'video': {
        'facingMode': camera == 'front' ? 'user' : 'environment',
        'mandatory': {'minWidth': '1280', 'minHeight': '720', 'minFrameRate': '30'},
      }
    };
    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    // Send stream to Parent device over WebRTC PeerConnection...
  }

  void _showLockScreen(String message) {
    // Locks UI and invokes DeviceAdminReceiver.lockNow()
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark(),
      home: const Scaffold(
        body: Center(child: Text("Kid Monitor Child Daemon Active")),
      ),
    );
  }
}`
  }
};

type SnippetKey = keyof typeof codeSnippets;

export const NativeCodeModal: React.FC<NativeCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeKey, setActiveKey] = useState<SnippetKey>('notificationListener');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const current = codeSnippets[activeKey];

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Flutter & React Native Production Architecture</h2>
              <p className="text-xs text-slate-400">
                Native Android & iOS Background Services Source Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          {(Object.keys(codeSnippets) as SnippetKey[]).map(k => (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeKey === k
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {codeSnippets[k].filename}
            </button>
          ))}
        </div>

        {/* Code Viewport */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950/70 font-mono text-xs leading-relaxed relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 font-semibold">{current.title}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-200 overflow-x-auto">
            <code>{current.code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Ready to compile with Flutter 3.24+ or React Native 0.74+</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
