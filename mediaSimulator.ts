/**
 * Media Stream provider supporting both real browser MediaDevices 
 * and interactive simulated streams for sandbox environments.
 */

export class MediaSimulator {
  private canvas: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  public createCameraStream(cameraType: 'front' | 'rear', childName: string): MediaStream {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    let tick = 0;

    const render = () => {
      tick++;
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      if (cameraType === 'front') {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
      } else {
        grad.addColorStop(0, '#111827');
        grad.addColorStop(1, '#1f2937');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Draw simulated scene (Child room / desk)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }

      // Draw subtle silhouette / face placeholder or room elements
      if (cameraType === 'front') {
        // Person sitting at desk
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        // Head with subtle breathing motion
        const bob = Math.sin(tick * 0.05) * 4;
        ctx.arc(320, 210 + bob, 55, 0, Math.PI * 2);
        ctx.fill();

        // Hair / hoodie
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(320, 360 + bob, 110, 80, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (blinking)
        const isBlinking = tick % 120 > 115;
        ctx.fillStyle = '#94a3b8';
        if (!isBlinking) {
          ctx.beginPath();
          ctx.arc(305, 205 + bob, 4, 0, Math.PI * 2);
          ctx.arc(335, 205 + bob, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(300, 204 + bob, 10, 2);
          ctx.fillRect(330, 204 + bob, 10, 2);
        }

        // Face detection bounding box (AI camera simulation)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(240, 130 + bob, 160, 190);
        ctx.fillStyle = '#22c55e';
        ctx.font = '11px monospace';
        ctx.fillText(`TARGET: ${childName.toUpperCase()}`, 245, 122 + bob);
        ctx.fillText(`CONFIDENCE: 98.4%`, 245, 335 + bob);

      } else {
        // Rear camera (Classroom / Desk view)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(100, 180, 440, 200); // Notebook / Desk
        ctx.fillStyle = '#3b82f6';
        ctx.font = '16px sans-serif';
        ctx.fillText('MATH WORKBOOK - Chapter 6', 140, 230);
        ctx.fillStyle = '#64748b';
        ctx.font = '13px monospace';
        ctx.fillText('2x + 14 = 30  =>  x = 8', 140, 270);
        ctx.fillText('Homework Due Tomorrow 9:00 AM', 140, 310);
      }

      // HUD overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(15, 15, 220, 42);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(30, 36, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('LIVE STREAM', 44, 34);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CAM: ${cameraType.toUpperCase()} | 1080p 30fps`, 44, 48);

      // Timestamp
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(440, 15, 185, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(new Date().toLocaleTimeString(), 455, 34);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.fillText('ENCRYPTED P2P WebRTC', 455, 48);

      this.animFrameId = requestAnimationFrame(render);
    };

    render();
    const stream = canvas.captureStream(30);
    return stream;
  }

  public stopStream() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.osc) {
      this.osc.stop();
      this.osc.disconnect();
      this.osc = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const mediaSimulator = new MediaSimulator();
