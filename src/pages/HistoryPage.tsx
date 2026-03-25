import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Play, Image, Type } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  name: string;
  file_type: string;
  gcode: string;
  created_at: string;
}

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('drawing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any;
      if (!error && data) setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('drawing_history').delete().eq('id', id) as any;
    if (!error) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast.success('Deleted from history');
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">Drawing History</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No history yet. Start drawing or writing!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {history.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-colors hover:bg-secondary/50 ${selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.file_type === 'drawing' ? <Image className="w-4 h-4 text-primary" /> : <Type className="w-4 h-4 text-accent" />}
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate('/', { state: { gcode: item.gcode } }); }}>
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedItem && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{selectedItem.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs font-mono max-h-96 overflow-auto">
                    {selectedItem.gcode}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
