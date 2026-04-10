/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';

const Production: React.FC = () => {
  const tasks = [
    { id: '1', order: '#1001', client: 'Cliente A', step: 'Corte', progress: 100, status: 'Completado' },
    { id: '2', order: '#1002', client: 'Cliente B', step: 'Costura', progress: 45, status: 'En Proceso' },
    { id: '3', order: '#1003', client: 'Cliente C', step: 'Estampado', progress: 0, status: 'Pendiente' },
    { id: '4', order: '#1004', client: 'Cliente D', step: 'Acabado', progress: 10, status: 'En Proceso' },
  ];

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
            <div className="text-2xl font-bold text-blue-900">12</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">En Espera de Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">3</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Listas para Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">8</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cola de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa Actual</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono font-bold">{task.order}</TableCell>
                  <TableCell>{task.client}</TableCell>
                  <TableCell>{task.step}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            task.progress === 100 ? "bg-green-500" : "bg-blue-500"
                          )} 
                          style={{ width: `${task.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      task.status === 'Completado' ? 'default' : 
                      task.status === 'En Proceso' ? 'secondary' : 'outline'
                    }>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status === 'Pendiente' && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Play size={14} /> Iniciar
                      </Button>
                    )}
                    {task.status === 'En Proceso' && (
                      <Button size="sm" variant="outline" className="gap-1 text-green-600 hover:text-green-700">
                        <CheckCircle size={14} /> Finalizar
                      </Button>
                    )}
                    {task.status === 'Completado' && (
                      <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" disabled>
                        <CheckCircle size={14} /> Listo
                      </Button>
                    )}
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

import { cn } from '@/lib/utils';
export default Production;
