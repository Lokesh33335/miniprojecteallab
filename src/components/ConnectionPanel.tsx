import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConnectionPanelProps {
  onConnectionChange: (connected: boolean, ip: string) => void;
}

export const ConnectionPanel = ({ onConnectionChange }: ConnectionPanelProps) => {
  const [ip, setIp] = useState('192.168.4.1');
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(`http://${ip}/`, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeout);
      setConnected(true);
      onConnectionChange(true, ip);
    } catch {
      setConnected(false);
      onConnectionChange(false, ip);
    }
    setChecking(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`status-dot ${connected ? 'status-dot-connected' : 'status-dot-disconnected'}`} />
        <span className="text-xs font-medium">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="flex gap-1">
        <Input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="ESP32 IP"
          className="text-xs h-8"
        />
        <Button size="sm" variant="outline" onClick={checkConnection} disabled={checking} className="h-8 px-2">
          {checking ? '...' : connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
};
