import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Upload } from 'lucide-react';

const FONTS = [
  { value: 'arial', label: 'Arial' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'courier', label: 'Courier New' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'comic', label: 'Comic Sans MS' },
  { value: 'verdana', label: 'Verdana' },
  { value: 'custom', label: '✏️ Custom Handwriting' },
];

interface WritingModeProps {
  onGCodeGenerated: (gcode: string) => void;
}

export const WritingMode = ({ onGCodeGenerated }: WritingModeProps) => {
  const [text, setText] = useState('');
  const [font, setFont] = useState('arial');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customChars, setCustomChars] = useState<Record<string, File | null>>({});

  const handleFontChange = (val: string) => {
    setFont(val);
    setShowCustom(val === 'custom');
  };

  const handleCustomCharUpload = (char: string, file: File | null) => {
    setCustomChars((prev) => ({ ...prev, [char]: file }));
  };

  const handleGenerate = () => {
    // Placeholder: In production, text-to-gcode conversion happens here
    const lines = text.split('\n');
    let gcode = '; Writing Mode G-Code\nG21 ; mm\nG90 ; absolute\nG28 X0 Y0 ; home\n';
    let y = 200;
    lines.forEach((line) => {
      gcode += `; Line: ${line}\n`;
      let x = 10;
      for (const char of line) {
        gcode += `G0 X${x} Y${y} ; move to "${char}"\n`;
        gcode += `M03 S90 ; pen down\nG4 P0.1\n`;
        gcode += `G1 X${x + 3} Y${y} F1000\n`;
        gcode += `M03 S190 ; pen up\nG4 P0.1\n`;
        x += 5;
      }
      y -= 10;
    });
    gcode += 'G28 X0 Y0 ; home\n';
    onGCodeGenerated(gcode);
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const digits = '0123456789'.split('');

  return (
    <div className="space-y-4">
      <div>
        <Label>Text to Write</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to write on paper..."
          rows={4}
          className="mt-1 font-mono"
        />
      </div>

      <div>
        <Label>Handwriting Font</Label>
        <Select value={font} onValueChange={handleFontChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCustom && (
        <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/50">
          <div>
            <Label>Custom Handwriting Name</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Lokesh"
              className="mt-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Upload an image of each character in your handwriting (A-Z, 0-9):
          </p>
          <div className="grid grid-cols-9 gap-2">
            {alphabet.map((ch) => (
              <label key={ch} className="flex flex-col items-center gap-1 cursor-pointer group">
                <span className="text-xs font-mono font-bold">{ch}</span>
                <div className={`w-8 h-8 rounded border flex items-center justify-center text-xs transition-colors ${customChars[ch] ? 'bg-accent text-accent-foreground border-accent' : 'bg-card border-border group-hover:border-primary'}`}>
                  {customChars[ch] ? '✓' : <Upload className="w-3 h-3 text-muted-foreground" />}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCustomCharUpload(ch, e.target.files?.[0] ?? null)}
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-2">
            {digits.map((d) => (
              <label key={d} className="flex flex-col items-center gap-1 cursor-pointer group">
                <span className="text-xs font-mono font-bold">{d}</span>
                <div className={`w-8 h-8 rounded border flex items-center justify-center text-xs transition-colors ${customChars[d] ? 'bg-accent text-accent-foreground border-accent' : 'bg-card border-border group-hover:border-primary'}`}>
                  {customChars[d] ? '✓' : <Upload className="w-3 h-3 text-muted-foreground" />}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCustomCharUpload(d, e.target.files?.[0] ?? null)}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={!text.trim()} className="w-full">
        <Type className="w-4 h-4 mr-2" />
        Generate Writing G-Code
      </Button>
    </div>
  );
};
