import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Save, Send, Trash2, Terminal } from 'lucide-react';

export interface ConsoleLog {
  time: string;
  message: string;
  type: 'sent' | 'info' | 'error';
}

interface GCodeEditorProps {
  gcode: string;
  onChange: (gcode: string) => void;
  onExecute: () => void;
  onSave: () => void;
  onSendLine: (line: string) => void;
  consoleLogs: ConsoleLog[];
}

export const GCodeEditor = ({ gcode, onChange, onExecute, onSave, onSendLine, consoleLogs }: GCodeEditorProps) => {
  const [commandLine, setCommandLine] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const lines = gcode.split('\n').filter((l) => l.trim());
  const lineCount = lines.length;

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const handleSendLine = () => {
    const line = commandLine.trim();
    if (!line) return;
    onSendLine(line);
    setCommandLine('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-mono">{lineCount} lines</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onSave} disabled={!gcode.trim()}>
            <Save className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange('')}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Textarea
          ref={textRef}
          value={gcode}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-h-[120px] font-mono text-xs resize-none"
          placeholder="; G-Code will appear here after conversion..."
          spellCheck={false}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 mt-2">
        <Button onClick={onExecute} disabled={!gcode.trim()} className="flex-1">
          <Play className="w-4 h-4 mr-1" /> Execute
        </Button>

        <div className="flex gap-2">
          <Input
            value={commandLine}
            onChange={(e) => setCommandLine(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendLine();
              }
            }}
            placeholder="Console (e.g., G0 X10 Y10)"
            className="h-8 font-mono text-xs"
          />
          <Button size="sm" onClick={handleSendLine} disabled={!commandLine.trim()} className="h-8">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Console Output */}
      <div className="mt-2 border border-border rounded-md bg-muted/50 overflow-hidden">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted">
          <Terminal className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">Console</span>
        </div>
        <ScrollArea className="h-24">
          <div className="p-1.5 space-y-0.5 font-mono text-[10px]">
            {consoleLogs.length === 0 && (
              <p className="text-muted-foreground italic">No commands sent yet...</p>
            )}
            {consoleLogs.map((log, i) => (
              <div key={i} className={`flex gap-1 ${log.type === 'error' ? 'text-destructive' : log.type === 'info' ? 'text-primary' : 'text-foreground'}`}>
                <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                <span className={log.type === 'sent' ? 'text-accent-foreground' : ''}>{log.type === 'sent' ? '→ ' : ''}{log.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
