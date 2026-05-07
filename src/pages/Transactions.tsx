/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ChevronLeft, ChevronRight, Edit2, Trash2, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';
import { useToast } from '@/components/ui/use-toast';
import BudgetPaymentModal from '@/components/BudgetPaymentModal';

const Transactions: React.FC = () => {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [budgetToEdit, setBudgetToEdit] = useState<any>(null);
  
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
            budget.payments.forEach((payment: any, index: number) => {
              flatTransactions.push({
                ...payment,
                budgetId: budget._id,
                budgetCode: budget._id.toString().slice(-6).toUpperCase(),
                budgetDesc: budget.description,
                clientName: budget.clientId?.razonSocial || 'Desconocido',
                id: payment._id || payment.id || `idx_${index}`,
                originalIndex: index,
                budget: budget
              });
            });
          }
        });
        
        flatTransactions.sort((a, b) => {
          const timeB = new Date(b.date).getTime();
          const timeA = new Date(a.date).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return String(b.id || '').localeCompare(String(a.id || ''));
        });
        setTransactions(flatTransactions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = () => {
    setEditPaymentId(null);
    setBudgetToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: any) => {
    setEditPaymentId(tx.id);
    setBudgetToEdit(tx.budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (tx: any) => {
    if (!confirm("¿Está seguro de eliminar este pago?")) return;
    try {
      const res = await fetch(`/api/budgets/${tx.budgetId}/payments/${tx.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({ title: 'Éxito', description: 'Pago eliminado correctamente' });
        fetchBudgets();
      } else {
        throw new Error("Error");
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar el pago', variant: 'destructive' });
    }
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

  const filteredTransactions = useMemo(() => {
    return transactionsInMonth.filter(tx => 
      !searchTerm || 
      tx.budgetDesc?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.budgetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactionsInMonth, searchTerm]);

  const totalRecaudadoMes = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.amountUSD || 0), 0);
  }, [filteredTransactions]);

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
              <Input placeholder="Buscar por ref, cliente, # o proyecto..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
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
                  <TableHead className="text-right">Acciones</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(tx)} title="Editar abono">
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(tx)} title="Eliminar abono">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={8} className="text-center p-8 text-slate-500">
                       No se encontraron transacciones.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 relative">
                <div className="flex justify-between items-start pr-12">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm text-slate-800">{tx.clientName}</span>
                    <span className="font-mono text-xs font-bold text-slate-500">#{tx.budgetCode} - <span className="font-normal truncate inline-block max-w-[150px] align-bottom">{tx.budgetDesc}</span></span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-black text-green-600">{formatCurrency(tx.amountUSD)}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold inline-flex items-center gap-1 mt-1">
                      <Calendar size={10} />
                      {new Date(tx.date).toLocaleDateString('es-VE')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 text-xs items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                    <CreditCard size={12} className="text-blue-600" />
                    <span className="font-bold text-slate-700">{tx.method}</span>
                  </div>
                  {tx.reference && (
                    <span className="text-slate-500 font-medium">Ref: {tx.reference}</span>
                  )}
                  <span className="ml-auto text-slate-600 font-bold border-l pl-2">
                    {tx.currency === 'USD' || tx.currency === 'USDT' ? '$' : tx.currency === 'VES' ? 'Bs. ' : '€'}
                    {tx.amount?.toLocaleString()} {tx.currency}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-full" onClick={() => handleEdit(tx)}>
                    <Edit2 size={12} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-full" onClick={() => handleDelete(tx)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
               <div className="text-center p-8 border rounded-xl bg-slate-50 text-slate-500">
                 No se encontraron transacciones.
               </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BudgetPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        budgets={budgets} 
        budget={budgetToEdit}
        editPaymentId={editPaymentId}
        onUpdate={fetchBudgets} 
      />
    </div>
  );
};

export default Transactions;

