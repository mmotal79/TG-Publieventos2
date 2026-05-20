/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Calendar, Loader2, UserPlus, Pencil, Trash2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';
import { useAuth } from '@/contexts/AuthContext';
import WorkerModal from '@/components/WorkerModal';
import { Worker } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const Payroll: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  // ... existing state ...
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showPayroll, setShowPayroll] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        setShowPayroll(config.showPayroll !== false);
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (err) {
      console.error("Error loading payroll data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchWorkers();
  }, []);

  const currentRole = profile?.role ?? 4;
  const isAdmin = currentRole === 0;
  const isManager = currentRole === 1;

  // RBAC Check: If Manager and showPayroll is false, or if neither Admin nor Manager
  const isAuthorized = isAdmin || (isManager && showPayroll);

  const handleDelete = async (worker: Worker) => {
    // UI check for hierarchy (Backend also checks this)
    const highHierarchyCargos = ['gerente', 'administrador', 'director', 'ceo'];
    const isHighHierarchy = highHierarchyCargos.includes(worker.cargo.toLowerCase());
    
    // Check if worker has system access and is Admin/Manager
    const isSystemLeader = worker.hasSystemAccess && worker.userId && 
                          (typeof worker.userId === 'object' && 
                           ((worker.userId as any).rol === 0 || (worker.userId as any).rol === 1));

    if (isHighHierarchy || isSystemLeader) {
      alert("No se puede eliminar personal con jerarquía de Gerencia o Administración.");
      return;
    }

    if (!confirm(`¿Está seguro de eliminar permanentemente a "${worker.nombre}"? Esta acción también revocará sus accesos al sistema.`)) return;

    try {
      const res = await fetch(`/api/workers/${worker._id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Trabajador y accesos eliminados correctamente'
        });
        fetchWorkers();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-8 text-center space-y-4">
        <div className="p-6 bg-rose-50 rounded-full border border-rose-100 shadow-xl shadow-rose-100/50">
          <ShieldCheck size={48} className="text-rose-500" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Acceso Restringido</h2>
        <p className="text-slate-500 max-w-md font-medium">Esta sección se encuentra temporalmente deshabilitada por administración o usted no cuenta con los privilegios suficientes.</p>
      </div>
    );
  }

  const totalBase = workers.reduce((sum, w) => sum + (w.sueldoBase || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 md:px-0">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Nómina e Incentivos</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Gestión de pagos, salarios y comisiones del personal institucional.</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedWorker(null);
            setIsModalOpen(true);
          }}
          className="h-12 rounded-xl px-6 shadow-xl shadow-primary/20 font-black uppercase text-[10px] tracking-[0.2em]"
        >
          <UserPlus size={16} className="mr-2" />
          Nuevo Personal
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Mensual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{formatCurrency(totalBase)}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1">Salario base total ({workers.length} pers.)</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capital Humano</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{workers.filter(w => w.status === 'activo').length} Activos</div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1">Personal calificado</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Periodo</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1">Corte administrativo</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-none bg-transparent md:bg-white md:border md:shadow-xl md:shadow-slate-200/50 md:rounded-[2rem] overflow-hidden">
        <CardHeader className="px-1 md:px-8 md:pt-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight italic">Detalle de Nómina</CardTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estructura salarial vigente</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-8">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto text-slate-900">
            <Table>
              <TableHeader>
                <TableRow className="border-y border-slate-100 bg-slate-50/50">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Colaborador</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Cargo</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Frecuencia</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Sueldo Base</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Variable (%)</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Estado</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5 text-right px-8">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((emp) => (
                  <TableRow key={emp._id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                         <span className="font-black text-slate-900 uppercase tracking-tight">{emp.nombre}</span>
                         <span className="text-[9px] font-bold text-slate-400">{emp.cedula}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {emp.cargo}
                    </TableCell>
                    <TableCell className="text-xs font-bold italic">{emp.frecuenciaPago}</TableCell>
                    <TableCell className="font-black text-primary">{formatCurrency(emp.sueldoBase || 0)}</TableCell>
                    <TableCell className="font-black italic text-rose-500">{emp.comision || 0}%</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'activo' ? 'outline' : 'secondary'} className={cn(
                        "px-3 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2",
                        emp.status === 'activo' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "bg-slate-100 text-slate-500"
                      )}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                       <div className="flex justify-end gap-1">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => {
                             setSelectedWorker(emp);
                             setIsModalOpen(true);
                           }}
                           className="rounded-full hover:bg-slate-100"
                         >
                           <Pencil size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => handleDelete(emp)}
                           className="rounded-full hover:bg-rose-50 group/del"
                         >
                           <Trash2 size={14} className="text-slate-300 group-hover/del:text-rose-500 transition-colors" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile approach */}
          <div className="md:hidden space-y-4 px-1 pb-10">
            {workers.map((emp) => (
              <Card key={emp._id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white active:scale-[0.98] transition-transform p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none mb-1">{emp.nombre}</h4>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{emp.cargo}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedWorker(emp);
                        setIsModalOpen(true);
                      }}
                      className="rounded-full bg-slate-50"
                    >
                      <Pencil size={14} className="text-slate-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(emp)}
                      className="rounded-full bg-slate-50 text-rose-400 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    <Mail size={12} className="text-slate-300" />
                    {emp.email}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    <Phone size={12} className="text-slate-300" />
                    {emp.telefono}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    <MapPin size={12} className="text-slate-300" />
                    {emp.direccion}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 my-2">
                  <div className="space-y-1 text-slate-950">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compensación</p>
                    <p className="text-sm font-black text-slate-950">{formatCurrency(emp.sueldoBase || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comisión</p>
                    <p className="text-sm font-black text-rose-500 italic">{emp.comision || 0}%</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                   <div className="flex items-center gap-2">
                     <Calendar size={12} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{emp.frecuenciaPago}</span>
                   </div>
                   <Badge variant="outline" className={cn(
                        "rounded-xl px-2 py-1 text-[8px] font-black uppercase border-2",
                        emp.status === 'activo' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "bg-slate-100 text-slate-500"
                      )}>
                    {emp.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <WorkerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkers}
        worker={selectedWorker}
      />
    </div>
  );
};

export default Payroll;
