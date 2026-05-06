import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/services/budgetService';
import { Check, Edit2, RotateCcw, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BudgetStatusModalProps {
  budget: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUSES = [
  { id: 'pending', label: 'Pendiente', color: 'bg-zinc-200 text-zinc-700' },
  { id: 'approved', label: 'Aceptado con Abono', color: 'bg-blue-200 text-blue-800' },
  { id: 'in_production', label: 'En Proceso', color: 'bg-indigo-300 text-indigo-900' },
  { id: 'completed', label: 'Culminado', color: 'bg-purple-300 text-purple-900' },
  { id: 'delivered', label: 'Entregado y Pagado', color: 'bg-green-400 text-green-900' },
  { id: 'cancelled', label: 'Anulado', color: 'bg-red-200 text-red-800' }
];

export default function BudgetStatusModal({ budget, isOpen, onClose, onUpdate }: BudgetStatusModalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [montoAbonado, setMontoAbonado] = useState<number>(0);
  const [isEditingAbono, setIsEditingAbono] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setCurrentStatus(budget.status || 'pending');
      setMontoAbonado(budget.montoAbonado || 0);
    }
  }, [budget]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
    e.dataTransfer.setData('statusId', statusId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropStatusId: string) => {
    e.preventDefault();
    const draggedStatusId = e.dataTransfer.getData('statusId');
    if (!draggedStatusId || draggedStatusId !== currentStatus) return; // Only drag the active card
    if (dropStatusId !== currentStatus) {
      setCurrentStatus(dropStatusId);
      saveChanges(dropStatusId, montoAbonado);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const saveChanges = async (newStatus: string, newAbono: number) => {
    if (!budget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/budgets/${budget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, montoAbonado: newAbono }),
      });
      if (res.ok) {
        onUpdate();
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Modificar Estatus de Pedido</DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h3 className="font-bold text-lg">{budget.clientId?.razonSocial || 'Desconocido'}</h3>
            <p className="text-sm text-slate-500">{budget.clientId?.contacto || budget.clientId?.personaContacto}</p>
            <p className="text-sm font-medium mt-1">"{budget.description}"</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm w-full md:w-auto">
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Presupuesto</p>
              <p className="font-black text-rose-600">{formatCurrency(totalCost)}</p>
            </div>
            
            <div className="text-center sm:text-right relative group">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Abonado</p>
              {isEditingAbono ? (
                <div className="flex items-center gap-1 justify-center sm:justify-end mt-1">
                  <Input 
                    type="number" 
                    value={montoAbonado}
                    onChange={(e) => setMontoAbonado(parseFloat(e.target.value) || 0)}
                    className="h-7 w-24 text-right text-sm font-bold"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 rounded-full" onClick={() => saveChanges(currentStatus, montoAbonado)}>
                    <Check size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <p className="font-black text-blue-600">{formatCurrency(montoAbonado)}</p>
                  <button onClick={() => setIsEditingAbono(true)} className="text-slate-300 hover:text-blue-500 transition-colors">
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
              <p className="font-black text-slate-800">{formatCurrency(pendiente)}</p>
            </div>
          </div>
        </div>

        <div className="py-2">
          <p className="text-sm text-center text-slate-500 mb-6 font-medium">Reorganiza el estado arrastrando la tarjeta actual al nuevo estado de destino, o haz click en el recuadro para avanzar directamente.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STATUSES.map(status => {
              const isActive = status.id === currentStatus;
              return (
                <div 
                  key={status.id}
                  className={`
                    min-h-[100px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                    ${isActive ? 'border-primary ring-4 ring-primary/20 bg-slate-50' : 'border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                  `}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.id)}
                  onClick={() => {
                    if (!isActive) {
                      setCurrentStatus(status.id);
                      saveChanges(status.id, montoAbonado);
                    }
                  }}
                >
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Mover a:
                  </p>
                  
                  {isActive ? (
                    <div 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, status.id)}
                      className={`px-4 py-3 rounded-lg shadow-sm font-bold text-sm w-full cursor-grab active:cursor-grabbing ${status.color}`}
                    >
                      {status.label}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-lg opacity-40 font-bold text-sm w-full border border-slate-200 bg-white">
                      {status.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
