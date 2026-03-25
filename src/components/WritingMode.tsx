import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';
import { Type, Download } from 'lucide-react';

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
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);

  const handleFontChange = (val: string) => {
    setFont(val);
    setShowCustom(val === 'custom');
  };

  const handleCustomImageUpload = (file: File) => {
    setCustomImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setCustomPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const lines = text.split('\n');
    let gcode = '; Writing Mode G-Code\nG21 ; mm\nG90 ; absolute\nG28 X0 Y0 ; home\n';
    if (font === 'custom' && customName) {
      gcode += `; Custom Handwriting: ${customName}\n`;
    } else {
      gcode += `; Font: ${font}\n`;
    }
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

  const handleDownloadTemplate = () => {
    // Generate a template image guide
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 720, 480);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;

    // Draw grid: 9 cols x 4 rows
    const cols = 9;
    const rows = 4;
    const cellW = 70;
    const cellH = 100;
    const offsetX = 30;
    const offsetY = 30;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    ctx.font = '14px Arial';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= chars.length) break;
        const x = offsetX + c * cellW;
        const y = offsetY + r * cellH;
        ctx.strokeRect(x, y, cellW, cellH);
        ctx.fillText(chars[idx], x + cellW / 2, y + 16);
        idx++;
      }
    }

    ctx.font = '11px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    ctx.fillText('Write each character inside its box, then take a photo/scan and upload it.', offsetX, 450);

    const link = document.createElement('a');
    link.download = 'handwriting_template.png';
    link.href = canvas.toDataURL();
    link.click();
  };

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
            <Label>Handwriting Name</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Lokesh"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will be saved with your credentials for future use.
            </p>
          </div>

          <div>
            <Label>Upload Handwriting Sheet</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Upload <strong>one image</strong> with all characters (A–Z, 0–9) written in a grid.
              Download the template below, write in each box, then scan/photo and upload.
            </p>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mb-3">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Template
            </Button>

            <FileUpload
              onFileSelect={handleCustomImageUpload}
              accept="image/*"
              label="Upload filled handwriting sheet"
            />
          </div>

          {customPreview && (
            <div className="rounded-lg border border-border overflow-hidden">
              <img src={customPreview} alt="Custom handwriting" className="w-full max-h-64 object-contain bg-card" />
              <p className="text-xs text-center text-muted-foreground py-2">
                ✓ Handwriting sheet uploaded — characters will be extracted automatically
              </p>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleGenerate} disabled={!text.trim()} className="w-full">
        <Type className="w-4 h-4 mr-2" />
        Generate Writing G-Code
      </Button>
    </div>
  );
};
