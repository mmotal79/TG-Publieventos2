/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';

const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          // Filter to show only internal employees (admin, manager, seller, staff)
          setEmployees(data.filter((u: any) => u.rol !== 4));
        }
      } catch (err) {
        console.error("Error loading payroll data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const totalBase = employees.reduce((sum, emp) => sum + (emp.salarioBaseUSD || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="px-1 md:px-0">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Nómina e Incentivos</h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2 font-medium">Gestión de pagos, salarios y comisiones del personal institucional.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Mensual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{formatCurrency(totalBase)}</div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1">Salario base total ({employees.length} pers.)</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[1.5rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capital Humano</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">{employees.length} Activos</div>
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
        <CardHeader className="px-1 md:px-8 md:pt-8">
          <CardTitle className="text-xl font-black uppercase tracking-tight italic">Detalle de Nómina</CardTitle>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estructura salarial vigente</p>
        </CardHeader>
        <CardContent className="p-0 md:p-8">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-y border-slate-100 bg-slate-50/50">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Colaborador</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Cargo</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Frecuencia</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Sueldo Base</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Variable (%)</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 py-5">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp._id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                    <TableCell className="font-black text-slate-900 uppercase tracking-tight">{emp.nombre}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {emp.rol === 0 ? 'Admin' : emp.rol === 1 ? 'Gerente' : emp.rol === 2 ? 'Vendedor' : 'Empleado'}
                    </TableCell>
                    <TableCell className="text-xs font-bold italic">{emp.frecuenciaPago || 'Mensual'}</TableCell>
                    <TableCell className="font-black text-primary">{formatCurrency(emp.salarioBaseUSD || 0)}</TableCell>
                    <TableCell className="font-black italic text-rose-500">{emp.porcentajeComision || 0}%</TableCell>
                    <TableCell>
                      <Badge variant={emp.estado === 'Activo' ? 'default' : 'secondary'} className="px-3 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest">
                        {emp.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile approach */}
          <div className="md:hidden space-y-4 px-1 pb-10">
            {employees.map((emp) => (
              <Card key={emp._id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white active:scale-[0.98] transition-transform p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none mb-1">{emp.nombre}</h4>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{emp.rol === 0 ? 'Admin' : emp.rol === 1 ? 'Gerente' : emp.rol === 2 ? 'Vendedor' : 'Operativo'}</span>
                  </div>
                  <Badge variant={emp.estado === 'Activo' ? 'default' : 'secondary'} className="rounded-xl px-2 py-1 text-[8px] font-black uppercase">
                    {emp.estado}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 my-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compensación</p>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(emp.salarioBaseUSD || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comisión</p>
                    <p className="text-sm font-black text-rose-500 italic">{emp.porcentajeComision || 0}%</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                   <div className="flex items-center gap-2">
                     <Calendar size={12} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{emp.frecuenciaPago || 'Mensual'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Wallet size={12} className="text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">USD Real</span>
                   </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payroll;
