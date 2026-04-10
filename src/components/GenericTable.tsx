/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Plus } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface GenericTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  onAdd: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
}

export function GenericTable<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = "Buscar..."
}: GenericTableProps<T>) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        <Button className="gap-2" onClick={onAdd}>
          <Plus size={18} />
          Agregar Nuevo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder={searchPlaceholder} className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, index) => (
                  <TableHead key={index}>{col.header}</TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    No hay datos disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((col, index) => (
                      <TableCell key={index}>
                        {typeof col.accessor === 'function' 
                          ? col.accessor(item) 
                          : String(item[col.accessor])}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right space-x-2">
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                            Editar
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
