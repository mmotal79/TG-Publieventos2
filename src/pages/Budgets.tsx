/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import BudgetForm from '@/components/BudgetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

const Budgets: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Presupuestos</h2>
        <p className="text-muted-foreground">Gestione y cree presupuestos técnicos para sus clientes.</p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Presupuestos</TabsTrigger>
          <TabsTrigger value="new">Nuevo Presupuesto</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">#PR-2026-00{i}</TableCell>
                      <TableCell>Cliente Ejemplo {i}</TableCell>
                      <TableCell>Uniformes Corporativos</TableCell>
                      <TableCell className="font-bold">$1,250.00</TableCell>
                      <TableCell>
                        <Badge variant={i === 1 ? "default" : i === 2 ? "secondary" : "outline"}>
                          {i === 1 ? "Aprobado" : i === 2 ? "Pendiente" : "En Producción"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">10/04/2026</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora Técnica de Presupuesto</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Budgets;
