/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/services/budgetService';

const Payroll: React.FC = () => {
  const employees = [
    { id: '1', name: 'Juan Pérez', role: 'Vendedor', base: 400, commission: 150, frequency: 'Mensual', status: 'Pagado' },
    { id: '2', name: 'María García', role: 'Costurera', base: 350, commission: 0, frequency: 'Semanal', status: 'Pendiente' },
    { id: '3', name: 'Carlos Ruiz', role: 'Gerente', base: 800, commission: 0, frequency: 'Quincenal', status: 'Pagado' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nómina e Incentivos</h2>
        <p className="text-muted-foreground">Gestión de pagos, salarios y comisiones del personal.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nómina Mes</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,250.00</div>
            <p className="text-xs text-muted-foreground">+5% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones Generadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$840.00</div>
            <p className="text-xs text-muted-foreground">Basado en ventas aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Abr 2026</div>
            <p className="text-xs text-muted-foreground">Corte de quincena</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Sueldo Base</TableHead>
                <TableHead>Comisiones</TableHead>
                <TableHead>Total a Pagar</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{emp.frequency}</TableCell>
                  <TableCell>{formatCurrency(emp.base)}</TableCell>
                  <TableCell>{formatCurrency(emp.commission)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(emp.base + emp.commission)}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === 'Pagado' ? 'default' : 'secondary'}>
                      {emp.status}
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
