export interface AppRule {
  packageName: string;
  name: string;
  icon: string;
  category: 'social' | 'games' | 'video' | 'chat' | 'educational' | 'utility';
  isBlocked: boolean;
  timeLimitMinutes: number; // 0 = unlimited
  usedMinutesToday: number;
}

export interface NotificationItem {
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

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: 'safe' | 'restricted' | 'school';
}

export interface ChildDevice {
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

export type ActiveTab = 'dashboard' | 'livestream' | 'location' | 'apps' | 'notifications' | 'pairing';
export type AppMode = 'parent' | 'child' | 'split';
export type StreamMode = 'camera' | 'audio' | 'screen';

export interface LocationBreadcrumb {
  id: string;
  latitude: number;
  longitude: number;
  timeString: string;
  locationName: string;
}
