import { ChildDevice, NotificationItem } from '../types';

type MessageHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: any = null;
  private url: string;
  private isConnected = false;
  private currentRole: 'parent' | 'child' = 'parent';
  private currentDeviceId?: string;

  constructor() {
    // Determine WS URL based on current window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}`;
  }

  public connect(role: 'parent' | 'child', deviceId?: string) {
    this.currentRole = role;
    this.currentDeviceId = deviceId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'register', role, deviceId });
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[KidMonitor WS] Connected as', role);
        this.send({ type: 'register', role, deviceId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(data));
        } catch (e) {
          console.error('[KidMonitor WS] Error parsing message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('[KidMonitor WS] Connection closed, reconnecting in 3s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[KidMonitor WS] Error:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('[KidMonitor WS] Init error', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.currentRole, this.currentDeviceId);
    }, 3000);
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('[KidMonitor WS] Socket not open, queued message:', payload.type);
    }
  }

  public sendCommand(deviceId: string, action: string, payload?: any) {
    // Also trigger REST endpoint for resilience
    fetch(`/api/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    }).catch(err => console.error('Failed to send command via REST:', err));

    this.send({
      type: 'remote_command',
      deviceId,
      action,
      payload
    });
  }

  public sendSos(deviceId: string) {
    this.send({
      type: 'sos_alert',
      deviceId
    });
  }

  public sendLocation(deviceId: string, location: { latitude: number; longitude: number; accuracy?: number; speedKmh?: number; address?: string }) {
    fetch(`/api/devices/${deviceId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location)
    }).catch(err => console.error('Failed to update location:', err));

    this.send({
      type: 'child_telemetry',
      deviceId,
      location
    });
  }

  public sendNotification(deviceId: string, notif: Partial<NotificationItem>) {
    fetch(`/api/devices/${deviceId}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif)
    }).catch(err => console.error('Failed to push notification:', err));
  }

  public updateAudioMeter(deviceId: string, decibels: number) {
    this.send({
      type: 'audio_meter',
      deviceId,
      decibels
    });
  }
}

export const wsService = new WebSocketClient();
