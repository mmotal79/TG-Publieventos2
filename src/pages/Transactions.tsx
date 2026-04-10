/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Plus, Search, DollarSign } from 'lucide-react';
import { TransaccionAbono } from '@/interfaces';
import { formatCurrency } from '@/services/budgetService';

const abonoSchema = z.object({
  budgetId: z.string().min(1, "Seleccione un presupuesto"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.enum(['USD', 'BS', 'CRYPTO']),
  tasaAplicada: z.number().min(1, "La tasa debe ser mayor a 0"),
  metodoPago: z.enum(['Efectivo', 'Transferencia', 'Zelle', 'Binance', 'Punto de Venta']),
  referencia: z.string().optional(),
});

type AbonoFormValues = z.infer<typeof abonoSchema>;

// Mock Data
const mockTransactions: TransaccionAbono[] = [
  { id: 't1', budgetId: 'PR-2026-001', clientId: 'c1', monto: 500, moneda: 'USD', tasaAplicada: 1, montoEquivalenteUSD: 500, metodoPago: 'Zelle', referencia: '123456', fecha: '2026-04-09', registradoPor: 'u1' },
  { id: 't2', budgetId: 'PR-2026-002', clientId: 'c2', monto: 18000, moneda: 'BS', tasaAplicada: 36, montoEquivalenteUSD: 500, metodoPago: 'Transferencia', referencia: '00012345', fecha: '2026-04-10', registradoPor: 'u1' },
];

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransaccionAbono[]>(mockTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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

  const onSubmit = (data: AbonoFormValues) => {
    setStatus('loading');
    setTimeout(() => {
      const newTx: TransaccionAbono = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        clientId: 'c1', // Mock client
        montoEquivalenteUSD: data.moneda === 'USD' ? data.monto : data.monto / data.tasaAplicada,
        fecha: new Date().toISOString().split('T')[0],
        registradoPor: 'u1'
      };
      setTransactions([newTx, ...transactions]);
      setStatus('success');
      setTimeout(() => setIsModalOpen(false), 1000);
    }, 1000);
  };

  const openModal = () => {
    reset();
    setStatus('idle');
    setIsModalOpen(true);
  };

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1000)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Transacciones</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar referencia o ID..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Monto Original</TableHead>
                <TableHead className="text-right">Equivalente USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.fecha}</TableCell>
                  <TableCell className="font-mono text-xs font-bold">{tx.budgetId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.metodoPago}</Badge>
                  </TableCell>
                  <TableCell>{tx.referencia || '-'}</TableCell>
                  <TableCell>
                    {tx.moneda === 'USD' ? '$' : tx.moneda === 'BS' ? 'Bs. ' : ''}
                    {tx.monto.toLocaleString()} {tx.moneda}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(tx.montoEquivalenteUSD)}
                  </TableCell>
                </TableRow>
              ))}
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
                  <SelectItem value="PR-2026-001">PR-2026-001 - Cliente VIP (Saldo: $750)</SelectItem>
                  <SelectItem value="PR-2026-002">PR-2026-002 - Distribuidora (Saldo: $200)</SelectItem>
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
                    <SelectItem value="BS">Bolívares (Bs)</SelectItem>
                    <SelectItem value="CRYPTO">USDT/Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {moneda !== 'USD' && (
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
