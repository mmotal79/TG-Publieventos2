import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Save, Trash2, GripVertical } from 'lucide-react';

interface Phase {
  _id?: string;
  name: string;
  key: string;
  weight: number;
  order: number;
  active: boolean;
}

export default function ProductionPhasesCatalog() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/production-phases');
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
           // Default phases if none exist
           setPhases([
             { name: 'Corte', key: 'corte', weight: 0.15, order: 0, active: true },
             { name: 'Costura', key: 'costura', weight: 0.35, order: 1, active: true },
             { name: 'Estampado/Bordado', key: 'estampado', weight: 0.55, order: 2, active: true },
             { name: 'Acabados', key: 'acabados', weight: 0.80, order: 3, active: true },
             { name: 'Empaquetado', key: 'empaquetado', weight: 0.95, order: 4, active: true },
             { name: 'Entrega', key: 'entrega', weight: 1.0, order: 5, active: true },
           ]);
        } else {
           setPhases(data);
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar las fases.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const addPhase = () => {
    setPhases([...phases, { name: '', key: '', weight: 0, order: phases.length, active: true }]);
  };

  const updatePhase = (index: number, field: keyof Phase, value: any) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate keys and names
    if (phases.some(p => !p.name || !p.key)) {
       toast({ title: 'Error', description: 'Todas las fases deben tener nombre y código único.', variant: 'destructive' });
       return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/production-phases/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phases),
      });
      if (res.ok) {
        toast({ title: 'Guardado', description: 'Configuración de producción actualizada.' });
        fetchPhases();
      } else {
        throw new Error();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Ocurrió un error al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Catálogo de Fases de Producción</h2>
          <p className="text-sm text-muted-foreground">Configura los pasos del proceso y su porcentaje de avance acumulado.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <Button variant="outline" onClick={addPhase} className="flex-1 md:flex-none gap-2 h-9 text-xs">
            <Plus size={14} /> Añadir Fase
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none gap-2 h-9 text-xs">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-0">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left w-20">Orden</th>
                  <th className="px-4 py-3 text-left">Nombre de la Fase</th>
                  <th className="px-4 py-3 text-left w-32">Cód. (Key)</th>
                  <th className="px-4 py-3 text-left w-32 font-black text-blue-600">Avance (0-1)</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phases.map((phase, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                       <Input 
                         type="number" 
                         value={phase.order} 
                         onChange={(e) => updatePhase(idx, 'order', parseInt(e.target.value))}
                         className="w-16 h-8 text-center text-xs font-bold"
                       />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        value={phase.name} 
                        onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                        placeholder="Ej. Corte"
                        className="h-8 text-sm font-medium"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        value={phase.key} 
                        onChange={(e) => updatePhase(idx, 'key', e.target.value)}
                        placeholder="ej_corte"
                        className="h-8 text-sm font-mono text-slate-500 bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={phase.weight} 
                        onChange={(e) => updatePhase(idx, 'weight', parseFloat(e.target.value))}
                        className="w-24 h-8 text-sm font-black border-blue-100 bg-blue-50/30"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePhase(idx)}
                        className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {phases.map((phase, idx) => (
              <div key={idx} className="p-4 space-y-4 bg-white">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">#</span>
                    <Input 
                      type="number" 
                      value={phase.order} 
                      onChange={(e) => updatePhase(idx, 'order', parseInt(e.target.value))}
                      className="w-12 h-7 text-center text-[10px] font-bold p-1"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removePhase(idx)}
                    className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Nombre Fase</label>
                    <Input 
                      value={phase.name} 
                      onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                      placeholder="Ej. Corte"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Peso Avance (0.00-1.00)</label>
                    <Input 
                      type="number"
                      step="0.05"
                      value={phase.weight} 
                      onChange={(e) => updatePhase(idx, 'weight', parseFloat(e.target.value))}
                      className="h-8 text-xs font-black bg-blue-50/50 border-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Key (Identificador)</label>
                  <Input 
                    value={phase.key} 
                    onChange={(e) => updatePhase(idx, 'key', e.target.value)}
                    placeholder="ej_corte"
                    className="h-8 text-[10px] font-mono text-slate-500 bg-slate-50"
                  />
                </div>
              </div>
            ))}
          </div>

          {phases.length === 0 && (
            <div className="p-8 text-center text-slate-500 italic text-sm">No hay fases configuradas.</div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
        <h4 className="text-xs font-black text-blue-800 mb-1 uppercase tracking-wider">Lógica de Cálculo (Incremental)</h4>
        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
          El "Peso" representa la posición en la línea de tiempo. Ejemplo: <br/>
          <span className="font-bold">Corte (0.15)</span> = 15% completado. <br/>
          <span className="font-bold">Costura (0.40)</span> = 40% completado. <br/>
          El sistema promedia estos valores según la distribución de unidades para mostrar el progreso real en la cola.
        </p>
      </div>
    </div>
  );
}
