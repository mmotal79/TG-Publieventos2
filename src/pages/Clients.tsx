/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, UserPlus } from 'lucide-react';

const Clients: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gestione su cartera de clientes y prospectos.</p>
        </div>
        <Button className="gap-2">
          <UserPlus size={18} />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Directorio de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Vendedor Asignado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">Corporación Textil {i}</div>
                    <div className="text-xs text-muted-foreground">RIF: J-12345678-9</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">contacto@textil{i}.com</div>
                    <div className="text-xs text-muted-foreground">+58 412-1234567</div>
                  </TableCell>
                  <TableCell className="text-sm">Caracas, Venezuela</TableCell>
                  <TableCell>
                    <div className="text-sm">Vendedor {i % 2 === 0 ? 'A' : 'B'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver Detalles</Button>
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

export default Clients;
