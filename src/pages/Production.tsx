/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, AlertCircle, Loader2, Edit3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import BudgetStatusModal from '@/components/BudgetStatusModal';
import ProductionUnitsModal from '@/components/ProductionUnitsModal';

const Production: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusEditingBudget, setStatusEditingBudget] = useState<any>(null);
  const [unitsEditingBudget, setUnitsEditingBudget] = useState<any>(null);
  const [productionPhases, setProductionPhases] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhases();
    fetchBudgets();
  }, []);

  const fetchPhases = async () => {
    try {
      const res = await fetch('/api/production-phases');
      if (res.ok) {
        const data = await res.json();
        setProductionPhases(data);
      }
    } catch (e) {
      console.error("Error loading phases", e);
    }
  };

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        
        let jobs = data.filter((b: any) => {
          return b.status !== 'pending' && (b.montoAbonado > 0 || (b.payments && b.payments.length > 0));
        });

        jobs.sort((a: any, b: any) => {
          const paymentsA = a.payments || [];
          const paymentsB = b.payments || [];
          
          let dateA = new Date(a.updatedAt || a.createdAt);
          if (paymentsA.length > 0) {
              const sortedPA = [...paymentsA].sort((p1:any, p2:any) => new Date(p1.date).getTime() - new Date(p2.date).getTime());
              dateA = new Date(sortedPA[0].date);
          }

          let dateB = new Date(b.updatedAt || b.createdAt);
          if (paymentsB.length > 0) {
              const sortedPB = [...paymentsB].sort((p1:any, p2:any) => new Date(p1.date).getTime() - new Date(p2.date).getTime());
              dateB = new Date(sortedPB[0].date);
          }
          
          return dateA.getTime() - dateB.getTime();
        });

        setBudgets(jobs);
      } else {
        toast({ title: 'Error', description: 'No se pudieron cargar las órdenes de producción.', variant: 'destructive' });
      }
    } catch (e) {
       toast({ title: 'Error', description: 'Error conectando al servidor.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getFractionalProgress = (budget: any) => {
    if (!budget.items || budget.items.length === 0) return 0;
    
    // Use dynamic phases if available, otherwise fallback to legacy weights
    const phasesToUse = productionPhases.length > 0 ? productionPhases : [
      { key: 'corte', weight: 0.15 },
      { key: 'costura', weight: 0.35 },
      { key: 'estampado', weight: 0.55 },
      { key: 'acabados', weight: 0.80 },
      { key: 'empaquetado', weight: 0.95 },
      { key: 'entrega', weight: 1.0 }
    ];

    const weights: Record<string, number> = {};
    phasesToUse.forEach(p => {
      weights[p.key] = p.weight;
    });

    let totalWeightedProgress = 0;
    let totalUnits = 0;

    budget.items.forEach((item: any) => {
      const qty = item.cantidad || 0;
      totalUnits += qty;
      
      if (item.productionStatus) {
        let itemProgress = 0;
        Object.entries(item.productionStatus).forEach(([phase, count]) => {
          const phaseCount = Number(count) || 0;
          itemProgress += phaseCount * (weights[phase] || 0);
        });
        totalWeightedProgress += itemProgress;
      }
    });

    if (totalUnits === 0) return 0;
    const progressPercent = (totalWeightedProgress / totalUnits) * 100;
    
    // Safety check: if status is 'completed' or 'delivered', always 100 unless override needed
    if (budget.status === 'completed' || budget.status === 'delivered') return 100;
    
    return Math.min(100, Math.round(progressPercent * 10) / 10);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'in_production': return 'En Producción';
      case 'completed': return 'Completado (Pendiente Entrega)';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const getStepText = (status: string) => {
    switch (status) {
      case 'approved': return 'Por Iniciar';
      case 'in_production': return 'En Proceso';
      case 'completed': return 'Listo / Control de Calidad';
      case 'delivered': return 'Entregado';
      default: return '-';
    }
  };

  const activeOrders = budgets.filter(b => ['approved', 'in_production'].includes(b.status)).length;
  const readyOrders = budgets.filter(b => b.status === 'completed').length;
  // Let's use 'approved' as waiting for material for now as proxy
  const waitingOrders = budgets.filter(b => b.status === 'approved').length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Producción</h2>
        <p className="text-muted-foreground">Seguimiento operativo de órdenes y procesos textiles.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Órdenes Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Por Iniciar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{waitingOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Listas para Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{readyOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cola de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              No hay órdenes de producción en la cola de trabajo.
            </div>
          ) : (
          <>
          <div className="md:hidden flex flex-col gap-4">
            {budgets.map((job, index) => {
              const progress = getFractionalProgress(job);
              const totalItems = job.items ? job.items.reduce((sum: number, it: any) => sum + (it.cantidad || 0), 0) : 0;
              const isFinished = job.status === 'completed' || job.status === 'delivered';
              
              return (
                <div key={job._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                   
                   <div className="flex justify-between items-start pl-2">
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest">#{index + 1}</span>
                         <span className="font-mono text-sm font-bold text-slate-800">OP-{job._id?.toString().slice(-6).toUpperCase()}</span>
                       </div>
                       <h3 className="font-bold text-lg text-slate-900 leading-tight">
                         {job.clientId?.razonSocial || 'Cliente Desconocido'} / {job.description}
                       </h3>
                     </div>
                     <Badge variant={isFinished ? 'default' : job.status === 'in_production' ? 'secondary' : 'outline'}>
                       {getStatusText(job.status)}
                     </Badge>
                   </div>

                   <div className="grid grid-cols-2 gap-4 pl-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cantidad Total</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setUnitsEditingBudget(job)}
                          className="h-9 font-bold bg-slate-50 border-slate-200 justify-start"
                        >
                          {totalItems} Unidades
                        </Button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Etapa</span>
                        <div className="h-9 flex items-center px-3 text-xs font-semibold bg-slate-50 rounded-md border border-slate-200 text-slate-700">
                          {getStepText(job.status)}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-2 pl-2">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Progreso Productivo</span>
                        <span className="text-sm font-black text-blue-600">{progress}%</span>
                     </div>
                     <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-700 ease-in-out",
                            progress === 100 ? "bg-green-500" : "bg-blue-500"
                          )} 
                          style={{ width: `${progress}%` }} 
                        />
                     </div>
                   </div>

                   <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button variant="ghost" size="sm" className="text-xs gap-2" onClick={() => setStatusEditingBudget(job)}>
                        <Settings size={14} /> Gestionar Estado
                      </Button>
                   </div>
                </div>
              );
            })}
          </div>
          
          <div className="hidden md:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente / Proyecto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead>Etapa Actual</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((job, index) => {
                const progress = getFractionalProgress(job);
                const isFinished = job.status === 'completed' || job.status === 'delivered';
                const totalItems = job.items ? job.items.reduce((sum: number, it: any) => sum + (it.cantidad || 0), 0) : 0;
                
                return (
                <TableRow key={job._id}>
                  <TableCell className="text-center font-bold text-slate-500">{index + 1}</TableCell>
                  <TableCell className="font-mono font-bold max-w-[200px]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-500">OP-</span>
                      {job._id?.toString().slice(-6).toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm py-2">
                    <div>{job.clientId?.razonSocial || job.clientId?.contacto || 'Desconocido'}</div>
                    <div className="text-[11px] text-slate-500 font-sans mt-1 leading-tight line-clamp-1 italic" title={job.description}>
                      {job.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setUnitsEditingBudget(job)}
                      className="font-bold border-dashed border-slate-300 hover:border-slate-400"
                    >
                      {totalItems} <span className="hidden sm:inline-block ml-1 font-normal text-slate-500">unids</span>
                    </Button>
                  </TableCell>
                  <TableCell>{getStepText(job.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            progress === 100 ? "bg-green-500" : "bg-blue-500"
                          )} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-medium">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      isFinished ? 'default' : 
                      job.status === 'in_production' ? 'secondary' : 'outline'
                    }>
                      {getStatusText(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1 text-xs h-8 text-slate-600 hover:text-slate-900" onClick={() => setStatusEditingBudget(job)}>
                        <Settings size={14} className="sm:mr-1" /> <span className="hidden sm:inline-block">Estado</span>
                      </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          </div>
          </>
          )}
        </CardContent>
      </Card>
      
      <BudgetStatusModal
        isOpen={!!statusEditingBudget}
        onClose={() => setStatusEditingBudget(null)}
        budget={statusEditingBudget}
        onUpdate={() => {
          setStatusEditingBudget(null);
          fetchBudgets();
        }}
      />

      <ProductionUnitsModal
        isOpen={!!unitsEditingBudget}
        onClose={() => setUnitsEditingBudget(null)}
        budget={unitsEditingBudget}
        onUpdate={() => {
          setUnitsEditingBudget(null);
          fetchBudgets();
        }}
      />
    </div>
  );
};

export default Production;
