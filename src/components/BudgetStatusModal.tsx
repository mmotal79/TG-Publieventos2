import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/services/budgetService';
import { Check, Edit2, RotateCcw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BudgetStatusModalProps {
  budget: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUSES = [
  { id: 'pendiente', label: 'Pendiente', color: 'bg-zinc-200 text-zinc-700', icon: RotateCcw },
  { id: 'aceptado_con_abono', label: 'Aceptado con Abono', color: 'bg-blue-200 text-blue-800', icon: Check },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-indigo-300 text-indigo-900', icon: Edit2 },
  { id: 'culminado', label: 'Culminado', color: 'bg-purple-300 text-purple-900', icon: Save },
  { id: 'entregado_y_pagado', label: 'Entregado y Pagado', color: 'bg-green-400 text-green-900', icon: Check },
  { id: 'anulado', label: 'Anulado', color: 'bg-red-200 text-red-800', icon: RotateCcw }
];

export default function BudgetStatusModal({ budget, isOpen, onClose, onUpdate }: BudgetStatusModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>('pendiente');
  const [montoAbonado, setMontoAbonado] = useState<number>(0);
  const [isEditingAbono, setIsEditingAbono] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setCurrentStatus(budget.status || 'pendiente');
      setMontoAbonado(budget.montoAbonado || 0);
    }
  }, [budget]);

  const saveChanges = async (newStatus: string, newAbono: number) => {
    if (!budget) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/budgets/${budget._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          montoAbonado: newAbono
        }),
      });
      if (res.ok) {
        onUpdate();
      } else {
        const error = await res.json();
        alert(error.error || "Error al actualizar estatus");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
      setIsEditingAbono(false);
    }
  };

  if (!budget) return null;

  const totalCost = budget.totalCost || 0;
  const pendiente = totalCost - montoAbonado;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={true} className="w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[95vh] overflow-y-auto p-0 border-none rounded-t-[2.5rem] sm:rounded-2xl fixed bottom-0 top-auto sm:relative sm:top-auto sm:bottom-auto translate-y-0 duration-300 ease-out">
        <DialogHeader className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight uppercase">Actualizar Estado</DialogTitle>
        </DialogHeader>

        <div className="p-6 pb-24 sm:pb-6">
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 mb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-1">
              <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter tabular-nums leading-tight">
                {budget.clientId?.razonSocial || 'Cliente Desconocido'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{budget.clientId?.identificacion || budget.clientId?.rif || 'S/D'}</span>
                <span className="text-slate-300">•</span>
                <p className="text-xs font-bold text-primary uppercase tracking-widest leading-none">"{budget.description}"</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm w-full md:w-auto">
              <div className="text-center px-4 py-2 border-r border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Total</p>
                <p className="font-black text-rose-600 text-base tabular-nums">{formatCurrency(totalCost)}</p>
              </div>
              
              <div className="text-center px-4 py-2 border-r border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Abonado</p>
                <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditingAbono(true)}>
                  <p className="font-black text-blue-600 text-base tabular-nums">{formatCurrency(montoAbonado)}</p>
                  <Edit2 size={10} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </div>

              <div className="text-center px-4 py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Pagar</p>
                <p className="font-black text-slate-800 text-base tabular-nums">{formatCurrency(pendiente)}</p>
              </div>
            </div>
          </div>

          {isEditingAbono && (
            <div className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2">Ajustar Monto del Abono</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  autoFocus
                  value={montoAbonado}
                  onChange={(e) => setMontoAbonado(parseFloat(e.target.value) || 0)}
                  className="h-12 text-lg font-black bg-white border-blue-200 rounded-2xl focus:ring-blue-500"
                />
                <Button className="h-12 px-6 rounded-2xl bg-blue-600 font-black uppercase text-[10px] tracking-widest" onClick={() => saveChanges(currentStatus, montoAbonado)}>
                  Actualizar
                </Button>
                <Button variant="ghost" className="h-12 px-4 rounded-2xl text-slate-500" onClick={() => setIsEditingAbono(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="h-[1px] flex-1 bg-slate-100" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 text-center">Panel de Control Operativo</p>
               <div className="h-[1px] flex-1 bg-slate-100" />
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATUSES.map(status => {
              const isActive = status.id === currentStatus;
              const StatusIcon = status.icon;

              return (
                <button 
                  key={status.id}
                  disabled={isSaving}
                  onClick={() => {
                    if (!isActive) {
                      saveChanges(status.id, montoAbonado);
                    }
                  }}
                  className={cn(
                    "relative group min-h-[120px] rounded-[2rem] border-2 p-6 flex flex-col items-center justify-center text-center transition-all",
                    isActive 
                      ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                      : "border-slate-100 bg-white hover:border-primary/40 hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "mb-3 p-3 rounded-2xl transition-all group-hover:scale-110",
                    isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-400"
                  )}>
                    <StatusIcon size={20} />
                  </div>
                  
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest mb-1",
                    isActive ? "text-primary" : "text-slate-400"
                  )}>
                    {isActive ? "Estado Actual" : "Mover a"}
                  </span>
                  
                  <h4 className={cn(
                    "font-black text-sm uppercase tracking-tight",
                    isActive ? "text-slate-900" : "text-slate-600"
                  )}>
                    {status.label}
                  </h4>

                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed sm:absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-md p-6 border-t border-slate-100 flex justify-center z-20">
          <Button variant="ghost" className="w-full sm:w-auto h-12 px-10 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl" onClick={onClose} disabled={isSaving}>
            Cancelar y Salir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
