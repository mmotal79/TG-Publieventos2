/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';
import { useToast } from '@/components/ui/use-toast';

const abonoSchema = z.object({
  budgetId: z.string().min(1, "Seleccione un presupuesto"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['USD', 'VES', 'USDT', 'EUR']),
  tasaAplicada: z.number().min(1, "La tasa debe ser mayor a 0"),
  metodoPago: z.string(),
  referencia: z.string().optional(),
});

type AbonoFormValues = z.infer<typeof abonoSchema>;

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation for months
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
        
        const flatTransactions: any[] = [];
        data.forEach((budget: any) => {
          if (budget.payments && budget.payments.length > 0) {
            budget.payments.forEach((payment: any) => {
              flatTransactions.push({
                ...payment,
                budgetId: budget._id,
                budgetCode: budget._id.toString().slice(-6).toUpperCase(),
                budgetDesc: budget.description,
                clientName: budget.clientId?.razonSocial || 'Desconocido',
                id: payment._id || Math.random().toString(),
              });
            });
          }
        });
        
        flatTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(flatTransactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AbonoFormValues>({
    resolver: zodResolver(abonoSchema),
    defaultValues: {
      moneda: 'USD',
      tasaAplicada: 1,
      metodoPago: 'Efectivo'
    }
  });

  const moneda = watch('moneda');
  const monto = watch('monto');
  const tasa = watch('tasaAplicada');

  const equivalenteUSD = moneda === 'USD' ? monto : (monto / (tasa || 1));

  const onSubmit = async (data: AbonoFormValues) => {
    setStatus('loading');
    try {
      const paymentData = {
        amount: data.monto,
        currency: data.moneda,
        method: data.metodoPago,
        reference: data.referencia || '',
        exchangeRate: data.moneda !== 'USD' ? data.tasaAplicada : 1,
        date: new Date(),
        amountUSD: equivalenteUSD
      };

      const res = await fetch(`/api/budgets/${data.budgetId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (res.ok) {
        setStatus('success');
        toast({ title: 'Éxito', description: 'Abono registrado exitosamente' });
        fetchBudgets();
        setTimeout(() => setIsModalOpen(false), 1000);
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      setStatus('error');
      toast({ title: 'Error', description: 'Error al registrar abono', variant: 'destructive' });
    }
  };

  const openModal = async () => {
    reset();
    setStatus('idle');
    try {
      const res = await fetch('/api/exchange-rates/current');
      if (res.ok) {
        const bd = await res.json();
        if (bd.rate) {
          setValue('tasaAplicada', bd.rate);
        }
      }
    } catch (e) { }
    setIsModalOpen(true);
  };

  // Month filtering logic
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const transactionsInMonth = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });
  }, [transactions, currentMonthStart, currentMonthEnd]);

  const totalRecaudadoMes = useMemo(() => {
    return transactionsInMonth.reduce((sum, tx) => sum + (tx.amountUSD || 0), 0);
  }, [transactionsInMonth]);

  const sortedDates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
  const earliestDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : new Date();
  
  const earliestMonthStart = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  const todaysMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const canGoPrevious = currentMonthStart > earliestMonthStart;
  const canGoNext = currentMonthStart < todaysMonthStart;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newD = new Date(prev);
      if (direction === 'prev') {
        newD.setMonth(newD.getMonth() - 1);
      } else {
        newD.setMonth(newD.getMonth() + 1);
      }
      return newD;
    });
  };

  const monthName = currentDate.toLocaleString('es-VE', { month: 'long', year: 'numeric' });
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const filteredTransactions = transactions.filter(tx => 
    !searchTerm || 
    tx.budgetDesc?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.budgetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transacciones y Abonos</h2>
          <p className="text-muted-foreground">Registre pagos y controle el saldo de los presupuestos.</p>
        </div>
        <Button className="gap-2" onClick={openModal}>
          <Plus size={18} />
          Registrar Abono
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
            <CardTitle className="text-sm font-medium">Total Recaudado ({formattedMonth})</CardTitle>
            <div className="flex items-center gap-1">
               <Button variant="outline" size="icon" className="h-6 w-6" disabled={!canGoPrevious} onClick={() => navigateMonth('prev')}>
                 <ChevronLeft size={14} />
               </Button>
               <Button variant="outline" size="icon" className="h-6 w-6" disabled={!canGoNext} onClick={() => navigateMonth('next')}>
                 <ChevronRight size={14} />
               </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecaudadoMes)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Historial de Transacciones</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por ref, cliente o #..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Monto Original</TableHead>
                <TableHead className="text-right">Equivalente USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString('es-VE')}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-bold text-slate-800">#{tx.budgetCode}</div>
                    <div className="text-[10px] text-slate-400 max-w-[150px] truncate" title={tx.budgetDesc}>{tx.budgetDesc}</div>
                  </TableCell>
                  <TableCell className="font-bold text-sm text-slate-700">{tx.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.method}</Badge>
                  </TableCell>
                  <TableCell>{tx.reference || '-'}</TableCell>
                  <TableCell>
                    {tx.currency === 'USD' || tx.currency === 'USDT' ? '$' : tx.currency === 'VES' ? 'Bs. ' : '€'}
                    {tx.amount?.toLocaleString()} {tx.currency}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(tx.amountUSD)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center p-8 text-slate-500">
                     No se encontraron transacciones.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Abono</DialogTitle>
            <DialogDescription>
              Ingrese los detalles del pago recibido.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetId">Presupuesto Aprobado</Label>
              <Select onValueChange={(v: string) => setValue('budgetId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.filter(b => b.status === 'approved' || b.status === 'in_production' || b.status === 'completed' || b.status === 'pending').map(b => (
                    <SelectItem key={b._id} value={b._id}>
                      #{b._id.toString().slice(-6).toUpperCase()} - {b.clientId?.razonSocial} (Saldo: {formatCurrency(Math.max(0, b.totalCost - (b.montoAbonado || 0)))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.budgetId && <p className="text-xs text-destructive">{errors.budgetId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input id="monto" type="number" step="0.01" {...register('monto', { valueAsNumber: true })} />
                {errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select defaultValue="USD" onValueChange={(v: any) => setValue('moneda', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="VES">Bolívares (VES)</SelectItem>
                    <SelectItem value="USDT">USDT/Crypto</SelectItem>
                    <SelectItem value="EUR">Euros (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {moneda !== 'USD' && moneda !== 'USDT' && (
              <div className="space-y-2">
                <Label htmlFor="tasaAplicada">Tasa de Cambio (a USD)</Label>
                <Input id="tasaAplicada" type="number" step="0.01" {...register('tasaAplicada', { valueAsNumber: true })} />
                {errors.tasaAplicada && <p className="text-xs text-destructive">{errors.tasaAplicada.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de Pago</Label>
                <Select defaultValue="Efectivo" onValueChange={(v: any) => setValue('metodoPago', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                    <SelectItem value="Zelle">Zelle</SelectItem>
                    <SelectItem value="Binance">Binance</SelectItem>
                    <SelectItem value="Punto de Venta">Punto de Venta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia (Opcional)</Label>
                <Input id="referencia" {...register('referencia')} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Equivalente en USD:</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(equivalenteUSD || 0)}
              </span>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Error al registrar el abono.
              </div>
            )}
            {status === 'success' && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                ¡Abono registrado exitosamente!
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'success' ? 'Guardado' : 'Procesar Abono'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;

