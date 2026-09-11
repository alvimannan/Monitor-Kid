import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface AppRule {
  packageName: string;
  name: string;
  icon: string;
  category: 'social' | 'games' | 'video' | 'chat' | 'educational' | 'utility';
  isBlocked: boolean;
  timeLimitMinutes: number; // 0 = unlimited
  usedMinutesToday: number;
}

interface NotificationItem {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  content: string;
  timestamp: number;
  category: 'message' | 'social' | 'alert' | 'system';
  isFlagged?: boolean;
  flagReason?: string;
}

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: 'safe' | 'restricted' | 'school';
}

interface ChildDevice {
  id: string;
  name: string;
  childName: string;
  model: string;
  platform: 'android' | 'ios';
  batteryLevel: number;
  isCharging: boolean;
  isLocked: boolean;
  lockMessage?: string;
  isOnline: boolean;
  lastSeen: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address: string;
    speedKmh: number;
    timestamp: number;
  };
  geofences: GeofenceZone[];
  permissions: {
    deviceAdmin: boolean;
    usageStats: boolean;
    notificationListener: boolean;
    mediaProjection: boolean;
    locationAlways: boolean;
    cameraMic: boolean;
    batteryOptimizationDisabled: boolean;
  };
  dailyScreenTimeLimitMinutes: number;
  todayScreenTimeUsedMinutes: number;
  currentAppRunning: string;
  ambientNoiseDb: number;
  activeCamera: 'front' | 'rear';
  apps: AppRule[];
  notifications: NotificationItem[];
}

const initialDevices: Record<string, ChildDevice> = {
  'child-device-1': {
    id: 'child-device-1',
    name: "Liam's Galaxy S24",
    childName: 'Liam (11 yrs)',
    model: 'Samsung Galaxy S24 (Android 14)',
    platform: 'android',
    batteryLevel: 78,
    isCharging: false,
    isLocked: false,
    isOnline: true,
    lastSeen: Date.now(),
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 8,
      address: '782 Market St, San Francisco, CA',
      speedKmh: 0,
      timestamp: Date.now(),
    },
    geofences: [
      { id: 'gf-1', name: 'Lincoln Middle School', latitude: 37.7749, longitude: -122.4194, radiusMeters: 250, type: 'school' },
      { id: 'gf-2', name: 'Home Sweet Home', latitude: 37.7833, longitude: -122.4167, radiusMeters: 150, type: 'safe' },
      { id: 'gf-3', name: 'Central Skate Park', latitude: 37.7690, longitude: -122.4467, radiusMeters: 300, type: 'safe' }
    ],
    permissions: {
      deviceAdmin: true,
      usageStats: true,
      notificationListener: true,
      mediaProjection: true,
      locationAlways: true,
      cameraMic: true,
      batteryOptimizationDisabled: true,
    },
    dailyScreenTimeLimitMinutes: 180, // 3 hours
    todayScreenTimeUsedMinutes: 114,
    currentAppRunning: 'YouTube Kids',
    ambientNoiseDb: 42,
    activeCamera: 'front',
    apps: [
      { packageName: 'com.google.android.youtube', name: 'YouTube', icon: 'youtube', category: 'video', isBlocked: false, timeLimitMinutes: 60, usedMinutesToday: 48 },
      { packageName: 'com.zhiliaoapp.musically', name: 'TikTok', icon: 'video', category: 'social', isBlocked: true, timeLimitMinutes: 30, usedMinutesToday: 30 },
      { packageName: 'com.roblox.client', name: 'Roblox', icon: 'gamepad', category: 'games', isBlocked: false, timeLimitMinutes: 45, usedMinutesToday: 25 },
      { packageName: 'com.instagram.android', name: 'Instagram', icon: 'camera', category: 'social', isBlocked: true, timeLimitMinutes: 20, usedMinutesToday: 0 },
      { packageName: 'com.whatsapp', name: 'WhatsApp', icon: 'message-circle', category: 'chat', isBlocked: false, timeLimitMinutes: 120, usedMinutesToday: 11 },
      { packageName: 'com.mojang.minecraftpe', name: 'Minecraft', icon: 'gamepad-2', category: 'games', isBlocked: false, timeLimitMinutes: 60, usedMinutesToday: 0 },
      { packageName: 'org.khanacademy.android', name: 'Khan Academy', icon: 'book-open', category: 'educational', isBlocked: false, timeLimitMinutes: 0, usedMinutesToday: 20 },
      { packageName: 'com.discord', name: 'Discord', icon: 'message-square', category: 'chat', isBlocked: false, timeLimitMinutes: 30, usedMinutesToday: 10 }
    ],
    notifications: [
      {
        id: 'notif-1',
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        title: 'Soccer Group Chat',
        content: 'Coach Mike: Practice starts tomorrow at 4:30 PM on Field 3. Bring cleats!',
        timestamp: Date.now() - 1000 * 60 * 5,
        category: 'message'
      },
      {
        id: 'notif-2',
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        title: 'New Video Upload',
        content: 'Mark Rober uploaded: "Can You Build a World Record Trap?"',
        timestamp: Date.now() - 1000 * 60 * 22,
        category: 'social'
      },
      {
        id: 'notif-3',
        packageName: 'com.discord',
        appName: 'Discord',
        title: 'Gaming Crew',
        content: 'Alex: Hey Liam you hopping on Minecraft tonight after homework?',
        timestamp: Date.now() - 1000 * 60 * 45,
        category: 'message'
      },
      {
        id: 'notif-4',
        packageName: 'com.android.systemui',
        appName: 'System',
        title: 'Battery Saver',
        content: 'Battery reached 78% (Estimated 7 hours remaining)',
        timestamp: Date.now() - 1000 * 60 * 90,
        category: 'system'
      }
    ]
  },
  'child-device-2': {
    id: 'child-device-2',
    name: "Emma's iPhone 15",
    childName: 'Emma (8 yrs)',
    model: 'Apple iPhone 15 (iOS 17.5)',
    platform: 'ios',
    batteryLevel: 92,
    isCharging: true,
    isLocked: false,
    isOnline: true,
    lastSeen: Date.now() - 1000 * 60 * 2,
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      accuracy: 5,
      address: 'Home - 450 Post St, San Francisco, CA',
      speedKmh: 0,
      timestamp: Date.now(),
    },
    geofences: [
      { id: 'gf-2', name: 'Home Sweet Home', latitude: 37.7833, longitude: -122.4167, radiusMeters: 150, type: 'safe' }
    ],
    permissions: {
      deviceAdmin: true,
      usageStats: true,
      notificationListener: true,
      mediaProjection: true,
      locationAlways: true,
      cameraMic: true,
      batteryOptimizationDisabled: true,
    },
    dailyScreenTimeLimitMinutes: 120,
    todayScreenTimeUsedMinutes: 45,
    currentAppRunning: 'Khan Academy Kids',
    ambientNoiseDb: 35,
    activeCamera: 'front',
    apps: [
      { packageName: 'org.khanacademy.kids', name: 'Khan Academy Kids', icon: 'book-open', category: 'educational', isBlocked: false, timeLimitMinutes: 0, usedMinutesToday: 35 },
      { packageName: 'com.roblox.client', name: 'Roblox', icon: 'gamepad', category: 'games', isBlocked: true, timeLimitMinutes: 30, usedMinutesToday: 10 },
      { packageName: 'com.apple.mobilephone', name: 'Phone', icon: 'phone', category: 'utility', isBlocked: false, timeLimitMinutes: 0, usedMinutesToday: 0 }
    ],
    notifications: [
      {
        id: 'notif-e1',
        packageName: 'org.khanacademy.kids',
        appName: 'Khan Academy Kids',
        title: 'Great Job!',
        content: 'Emma completed Lesson 4: Math Explorers and earned 3 stars!',
        timestamp: Date.now() - 1000 * 60 * 15,
        category: 'alert'
      }
    ]
  }
};

interface PairingCode {
  code: string;
  createdAt: number;
  expiresAt: number;
}

const activePairingCodes: Map<string, PairingCode> = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // WebSocket clients storage
  const sockets = new Set<WebSocket>();
  // Map socket to device role/id
  const socketClientMap = new Map<WebSocket, { role: 'parent' | 'child'; deviceId?: string }>();

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Kid Monitor Backend', time: new Date().toISOString() });
  });

  // Get all registered child devices
  app.get('/api/devices', (req, res) => {
    res.json(Object.values(initialDevices));
  });

  // Get specific device
  app.get('/api/devices/:id', (req, res) => {
    const device = initialDevices[req.params.id];
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  });

  // Generate 6-digit pairing code
  app.post('/api/pairing/generate', (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const pairing: PairingCode = {
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
    };
    activePairingCodes.set(code, pairing);
    res.json({ code, expiresAt: pairing.expiresAt });
  });

  // Redeem pairing code on child device
  app.post('/api/pairing/redeem', (req, res) => {
    const { code, childName, model, platform } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const record = activePairingCodes.get(code);
    if (!record || Date.now() > record.expiresAt) {
      // Allow demo codes "123456" or any active code for easy test flow
      if (code !== '123456' && code !== '999888') {
        return res.status(400).json({ error: 'Invalid or expired 6-digit code. Please generate a new code from the Parent App.' });
      }
    }

    activePairingCodes.delete(code);

    const newDeviceId = `child-device-${Date.now()}`;
    const newDevice: ChildDevice = {
      id: newDeviceId,
      name: `${childName || 'Child'}'s ${model || 'Device'}`,
      childName: childName || 'Child Device',
      model: model || 'Android Device',
      platform: (platform === 'ios' ? 'ios' : 'android'),
      batteryLevel: 95,
      isCharging: false,
      isLocked: false,
      isOnline: true,
      lastSeen: Date.now(),
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        address: 'Current Location',
        speedKmh: 0,
        timestamp: Date.now()
      },
      geofences: [
        { id: 'gf-new-1', name: 'Home', latitude: 37.7749, longitude: -122.4194, radiusMeters: 200, type: 'safe' }
      ],
      permissions: {
        deviceAdmin: true,
        usageStats: true,
        notificationListener: true,
        mediaProjection: true,
        locationAlways: true,
        cameraMic: true,
        batteryOptimizationDisabled: true,
      },
      dailyScreenTimeLimitMinutes: 180,
      todayScreenTimeUsedMinutes: 15,
      currentAppRunning: 'Home Screen',
      ambientNoiseDb: 40,
      activeCamera: 'front',
      apps: [
        { packageName: 'com.google.android.youtube', name: 'YouTube', icon: 'youtube', category: 'video', isBlocked: false, timeLimitMinutes: 60, usedMinutesToday: 10 },
        { packageName: 'com.whatsapp', name: 'WhatsApp', icon: 'message-circle', category: 'chat', isBlocked: false, timeLimitMinutes: 120, usedMinutesToday: 5 }
      ],
      notifications: [
        {
          id: `notif-init-${Date.now()}`,
          packageName: 'com.kidmonitor.child',
          appName: 'Kid Monitor',
          title: 'Device Paired Successfully',
          content: 'Child device is now monitored and secured by Parent App.',
          timestamp: Date.now(),
          category: 'system'
        }
      ]
    };

    initialDevices[newDeviceId] = newDevice;

    // Broadcast to all websockets that a new device paired
    broadcast({
      type: 'device_paired',
      device: newDevice
    });

    res.json({ success: true, deviceId: newDeviceId, device: newDevice });
  });

  // Remote command endpoint
  app.post('/api/devices/:id/command', (req, res) => {
    const { id } = req.params;
    const { action, payload } = req.body;
    const device = initialDevices[id];

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (action === 'lock') {
      device.isLocked = true;
      device.lockMessage = payload?.message || 'Device locked by Parents. Please complete chores or homework.';
    } else if (action === 'unlock') {
      device.isLocked = false;
      device.lockMessage = undefined;
    } else if (action === 'block_app') {
      const app = device.apps.find(a => a.packageName === payload?.packageName);
      if (app) app.isBlocked = true;
    } else if (action === 'unblock_app') {
      const app = device.apps.find(a => a.packageName === payload?.packageName);
      if (app) app.isBlocked = false;
    } else if (action === 'set_app_limit') {
      const app = device.apps.find(a => a.packageName === payload?.packageName);
      if (app) app.timeLimitMinutes = Number(payload?.limitMinutes) || 0;
    } else if (action === 'set_screen_limit') {
      device.dailyScreenTimeLimitMinutes = Number(payload?.limitMinutes) || 120;
    } else if (action === 'switch_camera') {
      device.activeCamera = device.activeCamera === 'front' ? 'rear' : 'front';
    }

    device.lastSeen = Date.now();

    // Broadcast update via WebSocket
    broadcast({
      type: 'device_updated',
      device
    });

    res.json({ success: true, device });
  });

  // Add simulated or incoming notification
  app.post('/api/devices/:id/notifications', (req, res) => {
    const { id } = req.params;
    const { appName, packageName, title, content, category } = req.body;
    const device = initialDevices[id];
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // Flag keywords check
    const sensitiveWords = ['secret', 'meet alone', 'hate', 'dont tell', 'party', 'alcohol', 'drugs', 'cheat', 'kill'];
    const textToCheck = `${title} ${content}`.toLowerCase();
    const flaggedWord = sensitiveWords.find(w => textToCheck.includes(w));

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      packageName: packageName || 'com.example.app',
      appName: appName || 'App',
      title: title || 'Notification',
      content: content || '',
      timestamp: Date.now(),
      category: category || 'message',
      isFlagged: !!flaggedWord,
      flagReason: flaggedWord ? `Flagged keyword: "${flaggedWord}"` : undefined
    };

    device.notifications.unshift(newNotif);
    if (device.notifications.length > 50) device.notifications.pop();

    broadcast({
      type: 'new_notification',
      deviceId: id,
      notification: newNotif
    });

    res.json({ success: true, notification: newNotif });
  });

  // Update location from child device
  app.post('/api/devices/:id/location', (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, accuracy, speedKmh, address } = req.body;
    const device = initialDevices[id];
    if (!device) return res.status(404).json({ error: 'Device not found' });

    device.location = {
      latitude: Number(latitude) || device.location.latitude,
      longitude: Number(longitude) || device.location.longitude,
      accuracy: Number(accuracy) || 5,
      speedKmh: Number(speedKmh) || 0,
      address: address || device.location.address,
      timestamp: Date.now()
    };
    device.lastSeen = Date.now();

    broadcast({
      type: 'location_updated',
      deviceId: id,
      location: device.location
    });

    res.json({ success: true, location: device.location });
  });

  // Create HTTP server & attach WebSocket Server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcast(data: object) {
    const msg = JSON.stringify(data);
    for (const client of sockets) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }

  wss.on('connection', (ws) => {
    sockets.add(ws);

    // Send initial device state to new connection
    ws.send(JSON.stringify({
      type: 'initial_state',
      devices: Object.values(initialDevices)
    }));

    ws.on('message', (messageRaw) => {
      try {
        const message = JSON.parse(messageRaw.toString());

        // Handle role registration
        if (message.type === 'register') {
          socketClientMap.set(ws, {
            role: message.role,
            deviceId: message.deviceId
          });
          return;
        }

        // Handle WebRTC signaling: offer, answer, ice-candidate
        if (message.type === 'webrtc_offer' || message.type === 'webrtc_answer' || message.type === 'webrtc_candidate') {
          // Relay signaling payload to all other connected clients
          for (const client of sockets) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(message));
            }
          }
          return;
        }

        // Handle live camera switch request
        if (message.type === 'switch_camera') {
          const device = initialDevices[message.deviceId];
          if (device) {
            device.activeCamera = message.camera;
            broadcast({
              type: 'camera_switched',
              deviceId: message.deviceId,
              camera: message.camera
            });
          }
          return;
        }

        // Handle ambient audio meter update
        if (message.type === 'audio_meter') {
          const device = initialDevices[message.deviceId];
          if (device) {
            device.ambientNoiseDb = message.decibels;
            broadcast({
              type: 'audio_meter_update',
              deviceId: message.deviceId,
              decibels: message.decibels
            });
          }
          return;
        }

        // Handle child SOS emergency button
        if (message.type === 'sos_alert') {
          const device = initialDevices[message.deviceId];
          const sosPayload = {
            type: 'sos_alert_received',
            deviceId: message.deviceId,
            childName: device?.childName || 'Child',
            location: device?.location,
            timestamp: Date.now(),
            battery: device?.batteryLevel
          };
          broadcast(sosPayload);
          return;
        }

        // Handle child ping / live telemetry
        if (message.type === 'child_telemetry') {
          const device = initialDevices[message.deviceId];
          if (device) {
            if (message.batteryLevel !== undefined) device.batteryLevel = message.batteryLevel;
            if (message.currentAppRunning) device.currentAppRunning = message.currentAppRunning;
            if (message.location) device.location = { ...device.location, ...message.location, timestamp: Date.now() };
            device.lastSeen = Date.now();
            device.isOnline = true;
            broadcast({
              type: 'device_updated',
              device
            });
          }
          return;
        }

      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      sockets.delete(ws);
      socketClientMap.delete(ws);
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kid Monitor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
