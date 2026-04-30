/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

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

export function GenericTable<T extends { id?: string; _id?: string }>({
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
        <CardContent className="p-0 md:p-6">
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  {columns.map((col, index) => (
                    <TableHead key={index} className="font-bold uppercase text-[10px] tracking-widest p-4">{col.header}</TableHead>
                  ))}
                  {(onEdit || onDelete) && <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest p-4">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-20 text-muted-foreground italic">
                      No hay datos disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id || item._id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                      {columns.map((col, index) => (
                        <TableCell key={index} className="p-4">
                          {typeof col.accessor === 'function' 
                            ? (col.accessor as any)(item) 
                            : <span className="font-medium text-slate-700">{String((item as any)[col.accessor as any])}</span>}
                        </TableCell>
                      ))}
                      {(onEdit || onDelete) && (
                        <TableCell className="text-right p-4">
                          <div className="flex justify-end gap-1">
                            {onEdit && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => onEdit(item)}>
                                <Pencil size={15} />
                              </Button>
                            )}
                            {onDelete && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-rose-600 hover:bg-rose-50" 
                                onClick={() => onDelete(item)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
            {data.length === 0 ? (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed rounded-xl italic">
                No hay datos disponibles.
              </div>
            ) : (
              data.map((item) => (
                <Card key={item.id || item._id} className="border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                       <div className="font-black text-slate-900 uppercase tracking-tighter text-sm">
                          {typeof columns[0].accessor === 'function' 
                            ? (columns[0].accessor as any)(item) 
                            : String((item as any)[columns[0].accessor as any])}
                       </div>
                       <div className="flex gap-2">
                          {onEdit && (
                            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 text-primary shadow-sm" onClick={() => onEdit(item)}>
                              <Pencil size={16} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200 text-rose-600 shadow-sm" onClick={() => onDelete(item)}>
                              <Trash2 size={16} />
                            </Button>
                          )}
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {columns.slice(1).map((col, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{col.header}</p>
                          <div className="text-xs font-bold text-slate-700 italic">
                             {typeof col.accessor === 'function' 
                              ? (col.accessor as any)(item) 
                              : String((item as any)[col.accessor as any])}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
