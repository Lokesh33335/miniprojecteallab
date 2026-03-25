import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AIModeProps {
  onGCodeGenerated: (gcode: string) => void;
}

export const AIMode = ({ onGCodeGenerated }: AIModeProps) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    // Simulate AI search with placeholder images
    setTimeout(() => {
      setResults([
        `https://via.placeholder.com/200x200?text=${encodeURIComponent(query)}+1`,
        `https://via.placeholder.com/200x200?text=${encodeURIComponent(query)}+2`,
        `https://via.placeholder.com/200x200?text=${encodeURIComponent(query)}+3`,
        `https://via.placeholder.com/200x200?text=${encodeURIComponent(query)}+4`,
      ]);
      setSearching(false);
      setSelected(null);
    }, 1500);
  };

  const handleConfirmDraw = () => {
    if (selected === null) return;
    setConverting(true);
    toast.info(`Converting "${query}" to pencil sketch & G-Code...`);
    // Simulate conversion
    setTimeout(() => {
      const gcode = `; AI Pencil Sketch: ${query}
; Converted to G-Code
G21 ; mm mode
G90 ; absolute positioning
G28 X0 Y0 ; home
M03 S190 ; pen up
; --- Sketch paths ---
G0 X10 Y10
M03 S90 ; pen down
G1 X50 Y10 F1000
G1 X50 Y50
G1 X10 Y50
G1 X10 Y10
M03 S190 ; pen up
G0 X20 Y20
M03 S90 ; pen down
G1 X40 Y20
G1 X40 Y40
G1 X20 Y40
G1 X20 Y20
M03 S190 ; pen up
G28 X0 Y0 ; home
`;
      onGCodeGenerated(gcode);
      setConverting(false);
      toast.success('Pencil sketch G-Code generated! Review and execute.');
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an image (e.g., Doraemon)..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          <Search className="w-4 h-4 mr-1" />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select an image to convert to pencil sketch:</p>
          <div className="grid grid-cols-2 gap-3">
            {results.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${selected === i ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}`}
              >
                <img src={url} alt={`Result ${i + 1}`} className="w-full h-32 object-cover bg-muted" />
                {selected === i && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {selected !== null && (
            <Button onClick={handleConfirmDraw} disabled={converting} className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              {converting ? 'Converting to Pencil Sketch...' : 'Confirm & Convert to Pencil Sketch'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
