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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nómina e Incentivos</h2>
        <p className="text-muted-foreground">Gestión de pagos, salarios y comisiones del personal (Información Real).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nómina Mensual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBase)}</div>
            <p className="text-xs text-muted-foreground">Basado en salario base USD de {employees.length} empleados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Personal administrativo y operativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fecha de Corte</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}</div>
            <p className="text-xs text-muted-foreground">Mes en curso</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Sueldo Base</TableHead>
                <TableHead>Comisión (%)</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell className="font-medium">{emp.nombre}</TableCell>
                  <TableCell>
                    {emp.rol === 0 ? 'Admin' : emp.rol === 1 ? 'Gerente' : emp.rol === 2 ? 'Vendedor' : 'Empleado'}
                  </TableCell>
                  <TableCell>{emp.frecuenciaPago || 'Mensual'}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(emp.salarioBaseUSD || 0)}</TableCell>
                  <TableCell>{emp.porcentajeComision || 0}%</TableCell>
                  <TableCell>
                    <Badge variant={emp.estado === 'Activo' ? 'default' : 'secondary'}>
                      {emp.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payroll;
