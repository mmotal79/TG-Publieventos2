import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/services/budgetService';
import { Plus, DollarSign, Calendar, FileText, Loader2, CreditCard, Maximize2, Minimize, X, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BudgetPaymentModalProps {
  budget?: any | null;
  budgets?: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  editPaymentId?: string | null;
}

export default function BudgetPaymentModal({ budget, budgets, isOpen, onClose, onUpdate, editPaymentId }: BudgetPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<string>('VES');
  const [method, setMethod] = useState<string>('Pago Móvil');
  const [reference, setReference] = useState<string>('');
  const [paymentIdToEdit, setPaymentIdToEdit] = useState<string | null>(null);

  // Format current date in VE timezone
  const getVeDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() - 240); // VE is UTC-4
    return d.toISOString().split('T')[0];
  };
  const [date, setDate] = useState<string>(getVeDate());

  const [localBudget, setLocalBudget] = useState<any>(null);

  useEffect(() => {
    if (budget) setLocalBudget(budget);
    else if (!isOpen) setLocalBudget(null);
  }, [budget, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (!editPaymentId) {
        setPaymentIdToEdit(null);
        setAmount('');
        setReference('');
        setDate(getVeDate());
      } else {
        setPaymentIdToEdit(editPaymentId);
      }
    } else {
      setPaymentIdToEdit(null);
      setAmount('');
      setReference('');
    }
  }, [isOpen, editPaymentId]);

  useEffect(() => {
    if (localBudget && localBudget.payments && paymentIdToEdit) {
      if (budget && localBudget._id !== budget._id) return; // Prevent old budget from bleeding into new modal open

      const pId = paymentIdToEdit;
      const p = localBudget.payments.find((p: any, idx: number) => 
        p._id === pId || p.id === pId || `idx_${idx}` === pId
      );
      if (p) {
        setAmount(p.amount);
        setCurrency(p.currency || 'USD');
        setMethod(p.method || 'Transferencia');
        setReference(p.reference || '');
        if (p.date) {
            const d = new Date(p.date);
            setDate(d.toISOString().split('T')[0]);
        }
        // Force a fetch of the exchange rate for the historical date
        fetchExchangeRateForDate(p.date ? new Date(p.date).toISOString().split('T')[0] : getVeDate());
      }
    }
  }, [localBudget, paymentIdToEdit, budget]);

  const fetchExchangeRateForDate = async (targetDate: string) => {
    try {
      // If the target date is today, fetch the current one so it gets the latest from DolarAPI if needed
      const endpoint = targetDate === getVeDate() 
        ? '/api/exchange-rates/current' 
        : `/api/exchange-rates/date/${targetDate}`;
        
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      }
    } catch (e) {
      console.error("Error fetching exchange rate:", e);
    }
  };

  useEffect(() => {
    if (isOpen && date) {
      fetchExchangeRateForDate(date);
    }
  }, [date, isOpen]);

  const totalCost = localBudget?.totalCost || 0;
  const montoAbonado = localBudget?.montoAbonado || 0;
  const pendiente = totalCost - montoAbonado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localBudget) return;
    
    if (!amount || Number(amount) <= 0) {
      toast({ title: 'Error', description: 'Ingrese un monto válido', variant: 'destructive' });
      return;
    }

    let amountUSD = Number(amount);
    if (currency === 'VES') {
      if (!exchangeRate || exchangeRate <= 0) {
        toast({ title: 'Error', description: 'Ingrese tasa de cambio válida', variant: 'destructive' });
        return;
      }
      amountUSD = Number(amount) / exchangeRate;
    }

    setIsSubmitting(true);
    try {
      const paymentData = {
        amount: Number(amount),
        currency,
        method,
        reference,
        exchangeRate: exchangeRate, // Record the actual rate regardless of currency so we have historical context
        date: new Date(date + 'T12:00:00Z'), // Add time to avoid timezone shift on save
        amountUSD
      };

      let res;
      if (paymentIdToEdit) {
        res = await fetch(`/api/budgets/${localBudget._id}/payments/${paymentIdToEdit}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });
      } else {
        res = await fetch(`/api/budgets/${localBudget._id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData),
        });
      }

      if (res.ok) {
        const updated = await res.json();
        setLocalBudget(updated);
        toast({ title: 'Éxito', description: paymentIdToEdit ? 'Pago actualizado correctamente' : 'Pago registrado correctamente' });
        onUpdate();
        // Clear form
        setPaymentIdToEdit(null);
        setAmount('');
        setReference('');
        if (onClose) onClose();
      } else {
        throw new Error('Error al registrar');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al registrar el pago', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("¿Está seguro de eliminar este pago?")) return;
    try {
      const res = await fetch(`/api/budgets/${localBudget._id}/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalBudget(updated);
        toast({ title: 'Éxito', description: 'Pago eliminado correctamente' });
        onUpdate();
        if (paymentIdToEdit === paymentId) {
           setPaymentIdToEdit(null);
           setAmount('');
           setReference('');
        }
      } else {
        throw new Error("Error");
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar el pago', variant: 'destructive' });
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Efectivo': return <DollarSign size={14} />;
      case 'Zelle': return <DollarSign size={14} className="text-purple-600" />;
      case 'Transferencia': return <CreditCard size={14} className="text-blue-600" />;
      default: return <CreditCard size={14} />;
    }
  };

  // Filter budgets to exclude 'pending', 'completed', 'delivered', 'paid', 'cancelled'
  const filterBudgetOptions = (b: any) => {
    const excludedStatus = ['pending', 'completed', 'delivered', 'paid', 'cancelled'];
    return !excludedStatus.includes(b.status);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className={`overflow-y-auto bg-white p-4 sm:p-6 transition-all duration-300 ease-in-out ${isMaximized ? 'w-screen h-screen max-w-none max-h-none rounded-none m-0' : 'w-[98vw] max-w-[1000px] max-h-[90vh] mx-auto'}`}>
        <div className="flex justify-between items-start pb-4 border-b">
          <DialogTitle className="text-xl">Registrar Abono</DialogTitle>
          <div className="flex items-center gap-1 -mt-2 -mr-2">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 h-9 w-9" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Restaurar Ventana" : "Maximizar Ventana"}>
              {isMaximized ? <Minimize size={20} /> : <Maximize2 size={20} />}
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 h-9 w-9" onClick={onClose} title="Cerrar">
              <X size={20} />
            </Button>
          </div>
        </div>

        {budgets && budgets.length > 0 && !budget && (
          <div className="my-4 space-y-2">
            <Label>Presupuesto</Label>
            <Select 
              value={localBudget?._id || ''} 
              onValueChange={(val) => {
                const found = budgets.find(b => b._id === val);
                if (found) setLocalBudget(found);
              }}
            >
              <SelectTrigger className="h-auto py-3 whitespace-normal text-left min-h-12 w-full">
                <SelectValue placeholder="Seleccione un presupuesto">
                  {localBudget ? (
                    <span className="font-semibold text-slate-800">
                      {localBudget.clientId?.razonSocial} {localBudget.description ? `(${localBudget.description})` : ''}
                    </span>
                  ) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-max">
                {budgets.filter(filterBudgetOptions).map(b => (
                  <SelectItem key={b._id} value={b._id} className="cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pr-4 break-words">
                      <span className="font-bold shrink-0">#{b._id.toString().slice(-6).toUpperCase()}</span>
                      <span className="font-medium text-slate-800 break-words">{b.clientId?.razonSocial} {b.description ? <span className="font-normal text-slate-500 italic">({b.description})</span> : ''}</span>
                      <span className="text-rose-600 font-bold shrink-0 sm:ml-auto">
                        Saldo: {formatCurrency(Math.max(0, b.totalCost - (b.montoAbonado || 0)))}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!localBudget && (!budgets || budgets.filter(filterBudgetOptions).length === 0) && (
          <div className="py-8 text-center text-slate-500">
            No hay presupuestos disponibles para registrar abonos.
          </div>
        )}

        {localBudget && (
        <>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 my-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="font-black text-xl text-slate-800">{localBudget.clientId?.razonSocial || 'Desconocido'}</h3>
              <p className="text-sm font-medium text-slate-600">{localBudget.clientId?.contacto || localBudget.clientId?.personaContacto}</p>
              <p className="text-sm text-slate-500">{localBudget.clientId?.telefono || localBudget.clientId?.celular || 'Sin teléfono'}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-bold uppercase text-rose-600 tracking-tight">{localBudget.description || `Presupuesto #${localBudget._id?.toString().slice(-6).toUpperCase()}`}</p>
              <p className="text-xs font-bold text-slate-500 mt-1">Tasa BCV: <span className="text-slate-800">{exchangeRate ? `${exchangeRate.toFixed(2)} Bs/USD` : 'Cargando...'}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center sm:items-end">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Presupuesto</p>
              <p className="font-black text-lg text-slate-800">{formatCurrency(totalCost)}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{formatCurrency(totalCost * (exchangeRate || 0), 'VES')}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center sm:items-end">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Abonado</p>
              <p className="font-black text-lg text-blue-600">{formatCurrency(montoAbonado)}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{formatCurrency(montoAbonado * (exchangeRate || 0), 'VES')}</p>
            </div>

            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 shadow-sm flex flex-col items-center sm:items-end">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Saldo Deudor</p>
              <p className="font-black text-lg text-rose-600">{formatCurrency(pendiente)}</p>
              <p className="text-xs font-bold text-rose-400 mt-0.5">{formatCurrency(pendiente * (exchangeRate || 0), 'VES')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Payment Form */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus size={16} className="text-primary" />
                  {paymentIdToEdit ? 'Editar Abono / Pago' : 'Nuevo Pago'}
                </CardTitle>
                <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded text-xs font-bold text-indigo-700">
                  <span>Tasa Bs/USD:</span>
                   <Input 
                    type="number" 
                    value={exchangeRate} 
                    onChange={e => setExchangeRate(Number(e.target.value))}
                    className="w-16 h-6 text-xs text-right font-black px-1 py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Monto</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={amount} 
                      onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')} 
                      required 
                      className="font-bold text-lg h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-10 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VES">Bolívares (VES)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="EUR">Euros (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Método</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Zelle">Zelle</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Binance">Binance / Crypto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Fecha (VE)</Label>
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      required 
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Referencia / Comentarios</Label>
                  <Input 
                    value={reference} 
                    onChange={e => setReference(e.target.value)} 
                    placeholder="Ref. Banco, Nota..." 
                    className="h-10"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full font-bold h-10 text-xs tracking-wide">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (paymentIdToEdit ? 'ACTUALIZAR PAGO' : 'REGISTRAR PAGO')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Historial de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px]">
              {(!localBudget.payments || localBudget.payments.length === 0) ? (
                <div className="p-8 text-center text-slate-400 italic font-medium text-sm">
                  No hay pagos registrados
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[...localBudget.payments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p: any, idx) => (
                    <div key={idx} className={`p-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${paymentIdToEdit === (p._id || p.id) ? 'bg-indigo-50/50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          {getMethodIcon(p.method)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{p.method}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded tracking-widest uppercase">
                              {new Date(p.date).toLocaleDateString('es-VE')}
                            </span>
                            {p.reference && <span className="text-xs text-slate-500">Ref: {p.reference}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-black text-rose-600">
                          {p.currency === 'VES' && <span className="text-xs text-slate-400 font-medium mr-1 tracking-tighter">({p.amount} Bs)</span>}
                          {formatCurrency(p.amountUSD)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => setPaymentIdToEdit(p._id || p.id)} title="Editar pago">
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(p._id || p.id)} title="Eliminar pago">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

