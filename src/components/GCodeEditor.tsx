import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Square, Save, Trash2 } from 'lucide-react';

interface GCodeEditorProps {
  gcode: string;
  onChange: (gcode: string) => void;
  onExecute: () => void;
  onSave: () => void;
  onSendLine: (line: string) => void;
}

export const GCodeEditor = ({ gcode, onChange, onExecute, onSave, onSendLine }: GCodeEditorProps) => {
  const [currentLine, setCurrentLine] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const lines = gcode.split('\n').filter((l) => l.trim());
  const lineCount = lines.length;

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
          className="h-full min-h-[200px] font-mono text-xs resize-none"
          placeholder="; G-Code will appear here after conversion..."
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2 mt-3">
        <Button onClick={onExecute} disabled={!gcode.trim()} className="flex-1">
          <Play className="w-4 h-4 mr-1" /> Execute
        </Button>
      </div>
    </div>
  );
};
