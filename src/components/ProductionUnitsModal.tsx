import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronRight, Copy, Loader2, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductionUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: any;
  onUpdate: () => void;
}

const PHASES = [
  { key: 'corte', label: 'Corte' },
  { key: 'costura', label: 'Costura' },
  { key: 'estampado', label: 'Estampado/Bordado' },
  { key: 'acabados', label: 'Acabados' },
  { key: 'empaquetado', label: 'Empaquetado' },
  { key: 'entrega', label: 'Entrega' },
];

export default function ProductionUnitsModal({ isOpen, onClose, budget, onUpdate }: ProductionUnitsModalProps) {
  const { toast } = useToast();
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicPhases, setDynamicPhases] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPhases();
    }
  }, [isOpen]);

  const fetchPhases = async () => {
    try {
      const res = await fetch('/api/production-phases');
      if (res.ok) {
        const data = await res.json();
        setDynamicPhases(data.length > 0 ? data : [
          { name: 'Corte', key: 'corte', weight: 0.15 },
          { name: 'Costura', key: 'costura', weight: 0.35 },
          { name: 'Estampado/Bordado', key: 'estampado', weight: 0.55 },
          { name: 'Acabados', key: 'acabados', weight: 0.8 },
          { name: 'Empaquetado', key: 'empaquetado', weight: 0.95 },
          { name: 'Entrega', key: 'entrega', weight: 1 }
        ]);
      }
    } catch (e) {
      console.error("Error loading phases", e);
    }
  };

  useEffect(() => {
    if (isOpen && budget && budget.items) {
      // Deep clone items so we can freely modify their statuses locally
      setLocalItems(JSON.parse(JSON.stringify(budget.items)));
      // Expand all by default
      const exp: any = {};
      budget.items.forEach((it: any) => exp[it._id || Math.random().toString()] = true);
      setExpandedItems(exp);
    }
  }, [isOpen, budget]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePhaseChange = (itemIndex: number, phaseKey: string, val: string) => {
    const num = parseInt(val, 10);
    const newItems = [...localItems];
    const item = newItems[itemIndex];
    if (!item.productionStatus) item.productionStatus = {};
    item.productionStatus[phaseKey] = isNaN(num) ? 0 : num;
    setLocalItems(newItems);
  };

  const updateItemTotalQty = (itemIndex: number, delta: number) => {
    const newItems = [...localItems];
    const item = newItems[itemIndex];
    const newQty = Math.max(1, (item.cantidad || 0) + delta);
    
    // Safety check: don't allow total to be less than items already in phases
    const phasesSum = dynamicPhases.reduce((sum, p) => sum + (item.productionStatus?.[p.key] || 0), 0);
    if (newQty < phasesSum) {
      toast({ 
        title: 'Atención', 
        description: `No puede reducir el total por debajo de las ${phasesSum} unidades ya asignadas a fases.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    item.cantidad = newQty;
    item.totalItem = item.cantidad * item.precioUnitario;
    setLocalItems(newItems);
  };

  const removeItem = (itemIndex: number) => {
    const newItems = [...localItems];
    newItems.splice(itemIndex, 1);
    setLocalItems(newItems);
  };

  const duplicateItem = (itemIndex: number) => {
    const newItems = [...localItems];
    const itemToClone = JSON.parse(JSON.stringify(newItems[itemIndex]));
    // Remove individual ID to let backend generate a new one if it's a new document subobject
    // though Mongoose often does this. Let's just make sure it feels like a new entry.
    if (itemToClone._id) delete itemToClone._id;
    // Reset production status for the new item
    itemToClone.productionStatus = {
        corte: 0, costura: 0, estampado: 0, acabados: 0, empaquetado: 0, entrega: 0
    };
    newItems.push(itemToClone);
    setLocalItems(newItems);
    toast({ title: 'Ítem duplicado', description: 'Se ha añadido una copia del ítem al pedido.' });
  };

  const handleSave = async () => {
    if (!budget) return;
    
    // Validate quantities
    for (const item of localItems) {
      let sum = 0;
      for (const p of dynamicPhases) {
         sum += (item.productionStatus?.[p.key] || 0);
      }
      if (sum > item.cantidad) {
        toast({ title: 'Error de validación', description: `Las unidades en las fases de producción superan la cantidad solicitada (${item.cantidad}) para un ítem.`, variant: 'destructive' });
        return;
      }
    }

    // Recalculate totalCost for the budget
    const newTotalCost = localItems.reduce((sum, it) => sum + (it.totalItem || 0), 0);
    // Note: This simplified calculation ignores volume discount for now, 
    // but usually changes in production might need a full budget recalculation.
    // We'll apply the discount if it was percentage based.
    const discountAmount = budget.volumeDiscountPercent 
      ? (newTotalCost * budget.volumeDiscountPercent / 100) 
      : budget.volumeDiscountAmount;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/budgets/${budget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: localItems,
          totalCost: newTotalCost - discountAmount,
          volumeDiscountAmount: discountAmount
        }),
      });
      if (res.ok) {
        toast({ title: 'Guardado', description: 'Unidades de producción actualizadas con éxito.' });
        onUpdate();
        onClose();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error al guardar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!budget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={true} className="w-[95vw] sm:w-[98vw] max-w-[650px] max-h-[95vh] h-full sm:h-auto overflow-y-auto p-0 border-none rounded-none sm:rounded-2xl">
        <div className="bg-white sticky top-0 z-10 p-4 sm:p-6 border-b border-slate-100 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Proceso Productivo</DialogTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[50px]">Cliente:</span>
                  <span className="text-xs font-bold text-slate-700 truncate">{budget?.clientId?.razonSocial || 'Cliente no definido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[50px]">Proyecto:</span>
                  <span className="text-xs text-slate-600 font-medium truncate">{budget?.description || 'Sin descripción'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[50px]">Entrada:</span>
                  <span className="text-xs text-slate-500 font-bold">{budget?.createdAt ? new Date(budget.createdAt).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>

            {/* General Progress Bar - Enhanced for Mobile */}
            <div className="w-full bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100/50">
              {(() => {
                const items = localItems || [];
                const totalUnits = items.reduce((sum, it) => sum + (Number(it.cantidad) || 0), 0);
                if (totalUnits === 0) return null;

                let weightedSum = 0;
                items.forEach(item => {
                  let itemWeightedSum = 0;
                  dynamicPhases.forEach(p => {
                    const qty = Number(item.productionStatus?.[p.key]) || 0;
                    const weight = Number(p.weight) || 0;
                    itemWeightedSum += qty * weight;
                  });
                  weightedSum += itemWeightedSum;
                });

                const generalProgress = Math.min(100, Math.round((weightedSum / totalUnits) * 100));

                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Progreso General de Orden</span>
                      <span className="text-xl sm:text-2xl font-black text-blue-800 leading-none">{generalProgress}%</span>
                    </div>
                    <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-blue-200/50 shadow-inner">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          generalProgress === 100 ? "bg-green-500" : "bg-blue-600"
                        )}
                        style={{ width: `${generalProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-2 space-y-4 pb-24">
          <div className="space-y-4">
            {localItems.map((item, idx) => {
              const id = item._id || String(idx);
              const isExpanded = expandedItems[id];
              
              const currentTotal = dynamicPhases.reduce((sum, phase) => sum + (item.productionStatus?.[phase.key] || 0), 0);
              const remaining = item.cantidad - currentTotal;

              return (
                <div key={id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div 
                    className="px-4 py-4 flex flex-col gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {isExpanded ? <ChevronDown size={18} className="text-slate-600" /> : <ChevronRight size={18} className="text-slate-600" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-slate-900 uppercase leading-tight tracking-tight">
                              {item.modeloId?.tipoPrenda || item.modeloId?.name || 'Ítem de Producción'}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Cantidad:</span>
                               <span className="text-xs font-black text-slate-700">{item.cantidad} ups</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-1">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-slate-400"
                           onClick={(e) => { e.stopPropagation(); duplicateItem(idx); }}
                         >
                           <Copy size={14} />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-rose-300"
                           onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar ítem?")) removeItem(idx); }}
                         >
                           <Trash2 size={14} />
                         </Button>
                       </div>
                    </div>

                    {/* Progress Bar Item Context */}
                    <div className="w-full space-y-1.5 bg-slate-50/50 p-2 sm:p-3 rounded-lg border border-slate-100">
                       {(() => {
                         const totalUnits = Number(item.cantidad) || 0;
                         let wSum = 0;
                         dynamicPhases.forEach(p => {
                            const qty = Number(item.productionStatus?.[p.key]) || 0;
                            const weight = Number(p.weight) || 0;
                            wSum += qty * weight;
                         });
                         const iProg = totalUnits === 0 ? 0 : Math.round((wSum / totalUnits) * 100);
                         
                         return (
                           <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between items-center px-0.5">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Progreso del Artículo</span>
                               <span className="text-xs font-black text-blue-600">{iProg}%</span>
                             </div>
                             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full transition-all duration-500", iProg === 100 ? "bg-green-500" : "bg-blue-500")}
                                 style={{ width: `${iProg}%` }}
                               />
                             </div>
                           </div>
                         );
                       })()}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="h-8 w-8 p-0" 
                          onClick={(e) => { e.stopPropagation(); updateItemTotalQty(idx, -1); }}
                        >-</Button>
                        <span className="text-xs font-black w-6 text-center">{item.cantidad}</span>
                        <Button 
                          variant="outline" 
                          className="h-8 w-8 p-0" 
                          onClick={(e) => { e.stopPropagation(); updateItemTotalQty(idx, 1); }}
                        >+</Button>
                      </div>
                      {remaining === 0 ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px]">Listo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{remaining} pdt.</Badge>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white space-y-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 gap-3">
                        {dynamicPhases.map(phase => (
                          <div key={phase.key} className="flex items-center justify-between bg-slate-50/30 p-2 rounded-lg border border-slate-50">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{phase.name || phase.label}</span>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number"
                                value={item.productionStatus?.[phase.key] || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  const otherSum = dynamicPhases.filter(p => p.key !== phase.key)
                                    .reduce((s, p) => s + (item.productionStatus?.[p.key] || 0), 0);
                                  
                                  if (val + otherSum > item.cantidad) {
                                    toast({ title: 'Límite', description: `Máximo ${item.cantidad}`, variant: 'destructive' });
                                    handlePhaseChange(idx, phase.key, String(item.cantidad - otherSum));
                                  } else {
                                    handlePhaseChange(idx, phase.key, e.target.value);
                                  }
                                }}
                                className="w-20 h-9 text-right text-sm font-black border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                        <span>Total Asignado</span>
                        <span className={cn(currentTotal > item.cantidad ? "text-rose-600" : "text-slate-800")}>
                          {currentTotal} / {item.cantidad}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="fixed sm:static bottom-0 left-0 w-full bg-white p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 z-20">
          <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10 text-xs font-bold" onClick={onClose} disabled={isSaving}>Cerrar</Button>
          <Button className="w-full sm:w-auto h-11 sm:h-10 text-xs font-black shadow-lg shadow-blue-200" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Producción
          </Button>
        </div>
      </DialogContent>

    </Dialog>
  );
}
