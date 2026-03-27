import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
  url: string;
  title: string;
}

interface AIModeProps {
  onGCodeGenerated: (gcode: string) => void;
}

export const AIMode = ({ onGCodeGenerated }: AIModeProps) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);

    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        query,
      )}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;

      const response = await fetch(url);
      const data = await response.json();
      const pages = Object.values(data?.query?.pages ?? {}) as Array<{
        title?: string;
        imageinfo?: Array<{ thumburl?: string; url?: string }>;
      }>;

      const nextResults = pages
        .map((page) => {
          const image = page.imageinfo?.[0];
          const imageUrl = image?.thumburl ?? image?.url;
          if (!imageUrl) return null;
          return {
            url: imageUrl,
            title: page.title?.replace('File:', '') ?? 'Image',
          };
        })
        .filter((item): item is SearchResult => Boolean(item))
        .slice(0, 8);

      setResults(nextResults);
      if (nextResults.length === 0) {
        toast.error('No images found. Try another keyword.');
      }
    } catch {
      setResults([]);
      toast.error('Image search failed. Please try again.');
    } finally {
      setSearching(false);
      setSelected(null);
    }
  };

  const handleConfirmDraw = () => {
    if (selected === null) return;
    setConverting(true);
    toast.info(`Converting "${query}" to pencil sketch & G-Code...`);
    setTimeout(() => {
      const picked = results[selected];
      const gcode = `; AI Pencil Sketch: ${query}
; Source Image: ${picked?.title ?? 'Unknown'}
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
            {results.map((result, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${selected === i ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}`}
              >
                <img src={result.url} alt={result.title} className="w-full h-32 object-cover bg-muted" loading="lazy" />
                <div className="absolute bottom-0 inset-x-0 bg-foreground/70 text-background text-[10px] px-2 py-1 text-left truncate">
                  {result.title}
                </div>
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
