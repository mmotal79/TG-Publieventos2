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
      <DialogContent showCloseButton={true} className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-none">
        <div className="bg-white sticky top-0 z-10 p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Proceso Productivo</DialogTitle>
              <div className="pt-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente:</span>
                  <span className="text-xs font-bold text-slate-700">{budget?.clientId?.razonSocial || 'Cliente no definido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proyecto:</span>
                  <span className="text-xs text-slate-600 font-medium">{budget?.description || 'Sin descripción'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entrada:</span>
                  <span className="text-xs text-slate-500">{budget?.createdAt ? new Date(budget.createdAt).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>

            {/* General Progress Bar (Proposed Logic 1: Weighted by Quantity) */}
            <div className="w-full md:w-auto md:text-right min-w-[140px] bg-slate-50 p-3 rounded-xl border border-slate-100">
              {(() => {
                const items = localItems || [];
                const totalUnits = items.reduce((sum, it) => sum + (it.cantidad || 0), 0);
                if (totalUnits === 0) return null;

                let weightedSum = 0;
                items.forEach(item => {
                  let itemWeightedSum = 0;
                  dynamicPhases.forEach(p => {
                    itemWeightedSum += (item.productionStatus?.[p.key] || 0) * (p.weight || 0);
                  });
                  weightedSum += itemWeightedSum;
                });

                const generalProgress = Math.min(100, Math.round((weightedSum / totalUnits) * 100));

                return (
                  <div className="space-y-1">
                    <div className="flex md:block justify-between items-end">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-tight block">Progreso General de Orden</span>
                      <span className="text-2xl font-black text-slate-900 leading-none">{generalProgress}%</span>
                    </div>
                    <div className="h-2 w-full md:w-32 bg-white rounded-full overflow-hidden mt-1 border border-slate-200">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          generalProgress === 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                        )}
                        style={{ width: `${generalProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500 leading-tight italic">
            Visualiza y gestiona el flujo de trabajo de cada ítem del pedido.
          </p>
        </div>

        <div className="p-6 pt-2 space-y-4">
          
          <div className="space-y-3">
            {localItems.map((item, idx) => {
              const id = item._id || String(idx);
              const isExpanded = expandedItems[id];
              
              const currentTotal = dynamicPhases.reduce((sum, phase) => sum + (item.productionStatus?.[phase.key] || 0), 0);
              const remaining = item.cantidad - currentTotal;

              return (
                <div key={id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleExpand(id)}
                  >
                    <div className="flex items-center gap-3">
                       {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                       <div className="flex flex-col">
                         <span className="font-black text-sm text-slate-800 uppercase tracking-tight">
                           {item.modeloId?.tipoPrenda || item.modeloId?.name || 'Ítem de Producción'}
                         </span>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Total Pedido:
                            </span>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-5 w-5 rounded-sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemTotalQty(idx, -1);
                                }}
                              >
                                -
                              </Button>
                              <span className="text-xs font-black min-w-[20px] text-center">{item.cantidad}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-5 w-5 rounded-sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemTotalQty(idx, 1);
                                }}
                              >
                                +
                              </Button>
                            </div>
                         </div>

                         {/* Item-specific progress bar */}
                         <div className="mt-2 w-full max-w-[200px] space-y-1">
                            {(() => {
                              const totalUnits = item.cantidad || 0;
                              if (totalUnits === 0) return null;
                              
                              let weightedSum = 0;
                              dynamicPhases.forEach(p => {
                                const qtyInPhase = item.productionStatus?.[p.key] || 0;
                                weightedSum += qtyInPhase * (p.weight || 0);
                              });
                              
                              const itemProgress = Math.min(100, Math.round((weightedSum / totalUnits) * 100));
                              
                              return (
                                <>
                                  <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Progreso Item</span>
                                    <span className="text-[10px] font-black text-blue-600">{itemProgress}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-500 ease-out",
                                        itemProgress === 100 ? "bg-green-500" : "bg-blue-500"
                                      )}
                                      style={{ width: `${itemProgress}%` }}
                                    />
                                  </div>
                                </>
                              );
                            })()}
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        title="Duplicar ítem"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateItem(idx);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-rose-600"
                        title="Eliminar ítem"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("¿Está seguro de eliminar este ítem del presupuesto?")) {
                            removeItem(idx);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                      {remaining === 0 ? (
                        <Badge variant="default" className="bg-green-600 text-[10px]">Asignado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-slate-300">{remaining} por asignar</Badge>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-3 border-t border-slate-100">
                      {dynamicPhases.map(phase => (
                        <div key={phase.key} className="flex items-center justify-between pl-4">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{phase.name || phase.label}</span>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min="0"
                              max={item.cantidad}
                              value={item.productionStatus?.[phase.key] || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                const otherPhasesSum = dynamicPhases.filter(p => p.key !== phase.key)
                                  .reduce((sum, p) => sum + (item.productionStatus?.[p.key] || 0), 0);
                                
                                if (val + otherPhasesSum > item.cantidad) {
                                  toast({ 
                                    title: 'Límite Superado', 
                                    description: `No puede asignar más de ${item.cantidad} unidades para este modelo.`, 
                                    variant: 'destructive' 
                                  });
                                  handlePhaseChange(idx, phase.key, String(item.cantidad - otherPhasesSum));
                                } else {
                                  handlePhaseChange(idx, phase.key, e.target.value);
                                }
                              }}
                              className="w-24 h-9 text-right text-sm font-black border-slate-200"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center pr-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total en Fases</span>
                        <span className={cn(
                          "text-sm font-black",
                          currentTotal > item.cantidad ? "text-rose-600" : "text-slate-800"
                        )}>
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
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Guardar Unidades
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
