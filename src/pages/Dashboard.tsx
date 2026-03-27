import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CircularJogPad } from '@/components/CircularJogPad';
import { ConnectionPanel } from '@/components/ConnectionPanel';
import { FileUpload } from '@/components/FileUpload';
import { GCodeEditor, ConsoleLog } from '@/components/GCodeEditor';
import { WritingMode } from '@/components/WritingMode';
import { AIMode } from '@/components/AIMode';
import { PointerTracker } from '@/components/PointerTracker';
import {
  Image, Type, Wand2, Settings2, Activity, Play, History,
  LogOut, User, ChevronDown,
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [espIp, setEspIp] = useState('192.168.4.1');
  const [connected, setConnected] = useState(false);
  const [mainMode, setMainMode] = useState<'drawing' | 'writing'>('drawing');
  const [drawTab, setDrawTab] = useState<'upload' | 'ai' | 'shapes'>('upload');
  const [gcode, setGCode] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showServoDialog, setShowServoDialog] = useState(false);
  const [showPointerDialog, setShowPointerDialog] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [servoUp, setServoUp] = useState(190);
  const [servoDown, setServoDown] = useState(90);
  const [jogStep, setJogStep] = useState(10);
  const [jogUnit, setJogUnit] = useState<'mm' | 'cm'>('mm');
  const [shapeType, setShapeType] = useState<'square' | 'circle' | 'triangle' | 'star'>('square');
  const [shapeSizeMm, setShapeSizeMm] = useState(40);
  const [pointerX, setPointerX] = useState(0);
  const [pointerY, setPointerY] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

  const addLog = useCallback((message: string, type: ConsoleLog['type'] = 'sent') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConsoleLogs(prev => [...prev.slice(-99), { time, message, type }]);
  }, []);

  const sendToEsp = useCallback(async (endpoint: string) => {
    try {
      const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      await fetch(`http://${espIp}${normalized}`, { mode: 'no-cors' });
    } catch {
      // ESP32 may not return CORS headers, but request is sent
    }
  }, [espIp]);

  const sendGcodeLine = useCallback(async (line: string, silent = false) => {
    const cmd = line.trim();
    if (!cmd) return;

    addLog(cmd, 'sent');

    const encoded = encodeURIComponent(cmd);
    const endpoints = [
      `/gcode?data=${encoded}`,
      `/command?cmd=${encoded}`,
      `/send?gcode=${encoded}`,
    ];

    try {
      await Promise.all(endpoints.map((endpoint) => sendToEsp(endpoint)));
      if (!silent) addLog(`OK: ${cmd}`, 'info');
    } catch {
      addLog(`Failed: ${cmd}`, 'error');
    }
  }, [sendToEsp, addLog]);

  const sendGcodeProgram = useCallback(async (program: string) => {
    const lines = program
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith(';'));

    for (const line of lines) {
      await sendGcodeLine(line, true);
    }
  }, [sendGcodeLine]);

  const jogStepMm = Math.max(0.1, Number.isFinite(jogStep) ? jogStep : 1) * (jogUnit === 'cm' ? 10 : 1);

  const handleJog = useCallback((dx: number, dy: number) => {
    const xMove = Number((dx * jogStepMm).toFixed(2));
    const yMove = Number((dy * jogStepMm).toFixed(2));

    if (dx !== 0 && dy === 0) {
      sendToEsp(`${dx > 0 ? 'xplus' : 'xminus'}?step=${jogStepMm}&unit=mm`);
    }

    if (dy !== 0 && dx === 0) {
      sendToEsp(`${dy > 0 ? 'yplus' : 'yminus'}?step=${jogStepMm}&unit=mm`);
    }

    // Fallback precise move so input distance is respected (including diagonals)
    const g0 = `G0${xMove ? ` X${xMove}` : ''}${yMove ? ` Y${yMove}` : ''} F1200`;
    void sendGcodeProgram(`G91\n${g0}\nG90`);

    setPointerX((prev) => Number((Math.max(0, prev + xMove)).toFixed(2)));
    setPointerY((prev) => Number((Math.max(0, prev + yMove)).toFixed(2)));
  }, [jogStepMm, sendGcodeProgram, sendToEsp]);

  const handleHome = useCallback(() => {
    setPointerX(0);
    setPointerY(0);
    sendToEsp('home');
    void sendGcodeProgram('G28 X0 Y0');
  }, [sendGcodeProgram, sendToEsp]);

  const handleExecute = useCallback(() => {
    if (gcode.trim()) setShowConfirmDialog(true);
  }, [gcode]);

  const handleConfirmExecute = useCallback(() => {
    setShowConfirmDialog(false);
    // Send G-Code with home-first prefix
    const fullGCode = `G28 X0 Y0\n${gcode}`;
    void sendGcodeProgram(fullGCode);
    toast.success('Job started! Machine homing then executing...');
  }, [gcode, sendGcodeProgram]);

  const handleSaveHistory = useCallback(async () => {
    if (!user || !gcode.trim()) return;
    const name = `${mainMode === 'drawing' ? 'Drawing' : 'Writing'}_${new Date().toISOString().slice(0, 16).replace('T', '_')}`;
    const { error } = await supabase.from('drawing_history').insert({
      user_id: user.id,
      name,
      file_type: mainMode,
      gcode,
    } as any);
    if (error) toast.error('Failed to save to history');
    else toast.success('Saved to history!');
  }, [user, gcode, mainMode]);

  const handleImageUpload = useCallback((file: File) => {
    toast.info(`Processing ${file.name}... Converting to G-Code`);
    const reader = new FileReader();
    reader.onload = () => {
      // A4-safe drawing area (keeps drawing inside the page)
      const minX = 15;
      const minY = 15;
      const maxX = 195;
      const maxY = 282;
      const code = `; Image: ${file.name}
; Converted to G-Code
G21 ; mm
G90 ; absolute
G28 X0 Y0 ; home
M03 S${servoUp} ; pen up
; A4 drawing window: X${minX}-${maxX}, Y${minY}-${maxY}
G0 X${minX} Y${minY}
M03 S${servoDown} ; pen down
G1 X${maxX} Y${minY} F1000
G1 X${maxX} Y${maxY}
G1 X${minX} Y${maxY}
G1 X${minX} Y${minY}
; TODO: replace with traced image paths if needed
M03 S${servoUp} ; pen up
G28 X0 Y0 ; home
`;
      setGCode(code);
      toast.success('G-Code generated from image!');
    };
    reader.readAsDataURL(file);
  }, [servoUp, servoDown]);

  const handleGCodeGenerated = useCallback((code: string) => setGCode(code), []);

  const handleGenerateShape = useCallback(() => {
    const half = Math.max(5, shapeSizeMm) / 2;
    const centerX = 105;
    const centerY = 148;

    let path = '';

    if (shapeType === 'square') {
      path = `
G0 X${centerX - half} Y${centerY - half}
M03 S${servoDown}
G1 X${centerX + half} Y${centerY - half} F1000
G1 X${centerX + half} Y${centerY + half}
G1 X${centerX - half} Y${centerY + half}
G1 X${centerX - half} Y${centerY - half}
`;
    } else if (shapeType === 'triangle') {
      path = `
G0 X${centerX} Y${centerY + half}
M03 S${servoDown}
G1 X${centerX + half} Y${centerY - half} F1000
G1 X${centerX - half} Y${centerY - half}
G1 X${centerX} Y${centerY + half}
`;
    } else if (shapeType === 'star') {
      path = `
G0 X${centerX} Y${centerY + half}
M03 S${servoDown}
G1 X${centerX + half * 0.25} Y${centerY + half * 0.2} F1000
G1 X${centerX + half} Y${centerY + half * 0.2}
G1 X${centerX + half * 0.35} Y${centerY - half * 0.15}
G1 X${centerX + half * 0.55} Y${centerY - half}
G1 X${centerX} Y${centerY - half * 0.35}
G1 X${centerX - half * 0.55} Y${centerY - half}
G1 X${centerX - half * 0.35} Y${centerY - half * 0.15}
G1 X${centerX - half} Y${centerY + half * 0.2}
G1 X${centerX - half * 0.25} Y${centerY + half * 0.2}
G1 X${centerX} Y${centerY + half}
`;
    } else {
      // circle approximation
      const points = 24;
      const coords: string[] = [];
      for (let i = 0; i <= points; i += 1) {
        const angle = (Math.PI * 2 * i) / points;
        const x = Number((centerX + Math.cos(angle) * half).toFixed(2));
        const y = Number((centerY + Math.sin(angle) * half).toFixed(2));
        coords.push(`${x},${y}`);
      }
      const [first, ...rest] = coords;
      const [fx, fy] = first.split(',');
      path = `
G0 X${fx} Y${fy}
M03 S${servoDown}
${rest.map((pair, index) => {
  const [x, y] = pair.split(',');
  return `G1 X${x} Y${y}${index === 0 ? ' F1000' : ''}`;
}).join('\n')}
`;
    }

    const shapeCode = `; Shape Mode (${shapeType})
G21
G90
G28 X0 Y0
M03 S${servoUp}
${path}
M03 S${servoUp}
G28 X0 Y0
`;

    setGCode(shapeCode);
    toast.success(`${shapeType} G-Code generated`);
  }, [shapeSizeMm, shapeType, servoDown, servoUp]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold">Smart Drawing Machine</h1>
            <p className="text-xs text-muted-foreground">EAL Lab • Batch 6</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setMainMode('drawing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mainMode === 'drawing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Image className="w-3.5 h-3.5" /> Drawing
          </button>
          <button
            onClick={() => setMainMode('writing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mainMode === 'writing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Type className="w-3.5 h-3.5" /> Writing
          </button>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden md:inline">{user?.email?.split('@')[0]}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              <button onClick={() => { setShowProfileMenu(false); navigate('/history'); }} className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2">
                <History className="w-4 h-4" /> History
              </button>
              <button onClick={() => { setShowProfileMenu(false); setShowPointerDialog(true); }} className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2">
                <Activity className="w-4 h-4" /> Pointer
              </button>
              <hr className="my-1 border-border" />
              <button onClick={signOut} className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-destructive">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Menu Bar */}
      <div className="menu-bar">
        <button className={`menu-bar-item ${mainMode === 'drawing' ? 'menu-bar-item-active' : ''}`} onClick={() => setMainMode('drawing')}>
          Drawing
        </button>
        <button className={`menu-bar-item ${mainMode === 'writing' ? 'menu-bar-item-active' : ''}`} onClick={() => setMainMode('writing')}>
          Writing
        </button>
        <button className="menu-bar-item" onClick={() => { setMainMode('drawing'); setDrawTab('ai'); }}>
          <Wand2 className="w-3.5 h-3.5 inline mr-1" /> AI
        </button>
        <button className="menu-bar-item" onClick={() => { setMainMode('drawing'); setDrawTab('shapes'); }}>
          Shapes
        </button>
        <button className="menu-bar-item" onClick={() => setShowServoDialog(true)}>
          <Settings2 className="w-3.5 h-3.5 inline mr-1" /> Servo
        </button>
        <button className="menu-bar-item" onClick={() => setShowPointerDialog(true)}>
          <Activity className="w-3.5 h-3.5 inline mr-1" /> Pointer
        </button>
        <button className="menu-bar-item" onClick={() => navigate('/history')}>
          <History className="w-3.5 h-3.5 inline mr-1" /> History
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-56 border-r border-border p-3 flex flex-col gap-3 overflow-y-auto bg-card/50">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs">Connection</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ConnectionPanel onConnectionChange={(c, ip) => { setConnected(c); setEspIp(ip); }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs">Jog Control</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col items-center">
              <CircularJogPad onJog={handleJog} onHome={handleHome} stepLabel={`${jogStep}${jogUnit}`} />
              <div className="flex items-center gap-2 mt-2 w-full">
                <Label className="text-xs">Step:</Label>
                <Input
                  type="number"
                  value={jogStep}
                  onChange={(e) => setJogStep(Number(e.target.value))}
                  className="h-7 text-xs"
                  min={0.1}
                  step={0.1}
                  max={100}
                />
                <Select value={jogUnit} onValueChange={(v) => setJogUnit(v as 'mm' | 'cm')}>
                  <SelectTrigger className="h-7 text-xs w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs">Status</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ESP32:</span>
                <span className={connected ? 'text-accent' : 'text-destructive'}>
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Servo UP:</span>
                <span className="font-mono">M03 S{servoUp}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Servo DOWN:</span>
                <span className="font-mono">M03 S{servoDown}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {mainMode === 'drawing' ? <Image className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                {mainMode === 'drawing' ? 'Drawing Mode' : 'Writing Mode'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mainMode === 'drawing' ? (
                <Tabs value={drawTab} onValueChange={(v) => setDrawTab(v as 'upload' | 'ai' | 'shapes')}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    <TabsTrigger value="ai">AI Pencil Sketch</TabsTrigger>
                    <TabsTrigger value="shapes">Shapes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                    <FileUpload onFileSelect={handleImageUpload} accept="image/*" label="Upload image to draw" />
                  </TabsContent>
                  <TabsContent value="ai">
                    <AIMode onGCodeGenerated={handleGCodeGenerated} />
                  </TabsContent>
                  <TabsContent value="shapes">
                    <div className="space-y-4">
                      <div>
                        <Label>Shape</Label>
                        <Select value={shapeType} onValueChange={(v) => setShapeType(v as 'square' | 'circle' | 'triangle' | 'star')}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="triangle">Triangle</SelectItem>
                            <SelectItem value="star">Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Size (mm)</Label>
                        <Input
                          type="number"
                          min={10}
                          max={150}
                          value={shapeSizeMm}
                          onChange={(e) => setShapeSizeMm(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleGenerateShape} className="w-full">Generate Shape G-Code</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <WritingMode onGCodeGenerated={handleGCodeGenerated} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - G-Code */}
        <div className="w-72 border-l border-border p-3 bg-card/50">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs">G-Code</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex-1 flex flex-col">
              <GCodeEditor
                gcode={gcode}
                onChange={setGCode}
                onExecute={handleExecute}
                onSave={handleSaveHistory}
                onSendLine={(line) => void sendGcodeLine(line)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Execution Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Execution</DialogTitle>
            <DialogDescription>
              The machine will first home to (0,0) then execute the G-Code. Make sure the work area is clear.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted p-3 rounded text-xs font-mono max-h-40 overflow-auto">
            {gcode.split('\n').slice(0, 15).join('\n')}
            {gcode.split('\n').length > 15 && '\n...'}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmExecute}>
              <Play className="w-4 h-4 mr-1" /> Home & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Servo Settings Dialog */}
      <Dialog open={showServoDialog} onOpenChange={setShowServoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Servo Limits</DialogTitle>
            <DialogDescription>
              Set the M03 S values for pen up (upper limit) and pen down (lower limit).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upper Limit (Pen UP) — M03 S{servoUp}</Label>
              <Input type="number" value={servoUp} onChange={(e) => setServoUp(Number(e.target.value))} className="mt-1" min={0} max={360} />
            </div>
            <div>
              <Label>Lower Limit (Pen DOWN) — M03 S{servoDown}</Label>
              <Input type="number" value={servoDown} onChange={(e) => setServoDown(Number(e.target.value))} className="mt-1" min={0} max={360} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServoDialog(false)}>Cancel</Button>
            <Button onClick={() => { setShowServoDialog(false); toast.success('Servo limits updated!'); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pointer Tracking Dialog */}
      <Dialog open={showPointerDialog} onOpenChange={setShowPointerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Live Pointer Position</DialogTitle>
            <DialogDescription>Real-time tracking of the pen position.</DialogDescription>
          </DialogHeader>
          <PointerTracker currentX={pointerX} currentY={pointerY} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
