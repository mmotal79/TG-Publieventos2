/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { Tela } from '@/interfaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const telaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  composicion: z.string().min(1, "La composición es requerida"),
  gramaje: z.number().min(1, "El gramaje debe ser mayor a 0"),
  costoPorMetro: z.number().min(0.01, "El costo debe ser mayor a 0"),
  color: z.string().min(1, "El color es requerido"),
  stockMetros: z.number().min(0, "El stock no puede ser negativo"),
});

type TelaFormValues = z.infer<typeof telaSchema>;

// Mock data
const initialData: Tela[] = [
  { id: '1', nombre: 'Algodón Pima', composicion: '100% Algodón', gramaje: 180, costoPorMetro: 5.50, color: 'Blanco', stockMetros: 500, activo: true },
  { id: '2', nombre: 'Gabardina', composicion: '65% Poliéster, 35% Algodón', gramaje: 240, costoPorMetro: 4.20, color: 'Azul Marino', stockMetros: 300, activo: true },
];

const TelasCatalog: React.FC = () => {
  const [data, setData] = useState<Tela[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tela | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TelaFormValues>({
    resolver: zodResolver(telaSchema),
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/catalogs/telas');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const openModal = (item?: Tela) => {
    if (item) {
      setEditingItem(item);
      reset({
        nombre: item.nombre,
        composicion: item.composicion,
        gramaje: item.gramaje,
        costoPorMetro: item.costoPorMetro,
        color: item.color,
        stockMetros: item.stockMetros,
      });
    } else {
      setEditingItem(null);
      reset({ nombre: '', composicion: '', gramaje: 0, costoPorMetro: 0, color: '', stockMetros: 0 });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: TelaFormValues) => {
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/telas/${editingItem._id}` : '/api/catalogs/telas';
    const method = editingItem ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, activo: true })
      });
      if (res.ok) {
        await fetchData();
        setStatus('success');
        setTimeout(() => setIsModalOpen(false), 1000);
      } else {
        throw new Error();
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar la tela "${item.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/catalogs/telas/${item._id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' as keyof Tela },
    { header: 'Composición', accessor: 'composicion' as keyof Tela },
    { header: 'Color', accessor: 'color' as keyof Tela },
    { header: 'Gramaje (g/m²)', accessor: 'gramaje' as keyof Tela },
    { header: 'Costo/m ($)', accessor: (item: Tela) => `$${(item.costoPorMetro || 0).toFixed(2)}` },
    { header: 'Stock (m)', accessor: 'stockMetros' as keyof Tela },
    { header: 'Estado', accessor: (item: Tela) => (
      <Badge variant={item.activo ? "default" : "secondary"}>
        {item.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
  ];

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <GenericTable<Tela>
          title="Catálogo de Telas"
          description="Gestione el inventario técnico y costos de telas."
          data={data.map(d => ({ ...d, id: d._id }))}
          columns={columns}
          onAdd={() => openModal()}
          onEdit={(item) => openModal(item)}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Tela' : 'Agregar Nueva Tela'}</DialogTitle>
            <DialogDescription>
              Ingrese los detalles técnicos de la tela.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="composicion">Composición</Label>
                <Input id="composicion" placeholder="Ej: 100% Algodón" {...register('composicion')} />
                {errors.composicion && <p className="text-xs text-destructive">{errors.composicion.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" {...register('color')} />
                {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gramaje">Gramaje (g/m²)</Label>
                <Input id="gramaje" type="number" {...register('gramaje', { valueAsNumber: true })} />
                {errors.gramaje && <p className="text-xs text-destructive">{errors.gramaje.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costoPorMetro">Costo por Metro ($)</Label>
                <Input id="costoPorMetro" type="number" step="0.01" {...register('costoPorMetro', { valueAsNumber: true })} />
                {errors.costoPorMetro && <p className="text-xs text-destructive">{errors.costoPorMetro.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockMetros">Stock (Metros)</Label>
                <Input id="stockMetros" type="number" {...register('stockMetros', { valueAsNumber: true })} />
                {errors.stockMetros && <p className="text-xs text-destructive">{errors.stockMetros.message}</p>}
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Ocurrió un error al guardar. Intente nuevamente.
              </div>
            )}

            {status === 'success' && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                ¡Guardado exitosamente!
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'success' ? 'Guardado' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TelasCatalog;
