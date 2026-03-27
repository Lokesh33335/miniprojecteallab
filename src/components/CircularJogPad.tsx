import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  Home,
} from 'lucide-react';

interface CircularJogPadProps {
  onJog: (dx: number, dy: number) => void;
  onHome: () => void;
  stepLabel?: string;
}

export const CircularJogPad = ({ onJog, onHome, stepLabel = '10mm' }: CircularJogPadProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-2 border-border bg-secondary/50" />

        {/* Up Left */}
        <button
          onClick={() => onJog(-1, 1)}
          className="jog-btn top-4 left-4"
          title="X- Y+"
        >
          <ArrowUpLeft className="w-5 h-5" />
        </button>

        {/* Up */}
        <button
          onClick={() => onJog(0, 1)}
          className="jog-btn top-1 left-1/2 -translate-x-1/2"
          title="Y+"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Up Right */}
        <button
          onClick={() => onJog(1, 1)}
          className="jog-btn top-4 right-4"
          title="X+ Y+"
        >
          <ArrowUpRight className="w-5 h-5" />
        </button>

        {/* Down */}
        <button
          onClick={() => onJog(0, -1)}
          className="jog-btn bottom-1 left-1/2 -translate-x-1/2"
          title="Y-"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        {/* Down Left */}
        <button
          onClick={() => onJog(-1, -1)}
          className="jog-btn bottom-4 left-4"
          title="X- Y-"
        >
          <ArrowDownLeft className="w-5 h-5" />
        </button>

        {/* Down Right */}
        <button
          onClick={() => onJog(1, -1)}
          className="jog-btn bottom-4 right-4"
          title="X+ Y-"
        >
          <ArrowDownRight className="w-5 h-5" />
        </button>

        {/* Left */}
        <button
          onClick={() => onJog(-1, 0)}
          className="jog-btn left-1 top-1/2 -translate-y-1/2"
          title="X-"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right */}
        <button
          onClick={() => onJog(1, 0)}
          className="jog-btn right-1 top-1/2 -translate-y-1/2"
          title="X+"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Home center */}
        <button
          onClick={onHome}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all shadow-lg cursor-pointer"
          title="Home"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Step: {stepLabel}</p>
    </div>
  );
};
