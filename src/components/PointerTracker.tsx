import { useEffect, useRef, useState } from 'react';

interface PointerTrackerProps {
  canvasWidth?: number;
  canvasHeight?: number;
  currentX?: number;
  currentY?: number;
}

export const PointerTracker = ({
  canvasWidth = 300,
  canvasHeight = 200,
  currentX = 0,
  currentY = 0,
}: PointerTrackerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    setTrail((prev) => [...prev.slice(-200), { x: currentX, y: currentY }]);
  }, [currentX, currentY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'hsl(220, 15%, 88%)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(210, 100%, 45%)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      trail.forEach((p, i) => {
        const px = (p.x / canvasWidth) * w;
        const py = h - (p.y / canvasHeight) * h;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Current position dot
    const cx = (currentX / canvasWidth) * w;
    const cy = h - (currentY / canvasHeight) * h;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'hsl(0, 72%, 51%)';
    ctx.fill();
    ctx.strokeStyle = 'hsl(0, 0%, 100%)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [trail, currentX, currentY, canvasWidth, canvasHeight]);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className="w-full rounded border border-border bg-card"
      />
      <div className="flex justify-between text-xs font-mono text-muted-foreground">
        <span>X: {currentX.toFixed(1)}</span>
        <span>Y: {currentY.toFixed(1)}</span>
      </div>
    </div>
  );
};
