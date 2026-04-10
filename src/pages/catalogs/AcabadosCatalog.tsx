/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  costoUnitario: z.number().min(0, "Debe ser mayor o igual a 0"),
  activo: z.boolean()
});

type FormValues = z.infer<typeof schema>;

const AcabadosCatalog: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true }
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/catalogs/acabados');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      reset(item);
    } else {
      setEditingItem(null);
      reset({ nombre: '', descripcion: '', costoUnitario: 0, activo: true });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/acabados/${editingItem._id}` : '/api/catalogs/acabados';
    const method = editingItem ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchData();
        setStatus('success');
        setTimeout(() => setIsModalOpen(false), 1000);
      } else throw new Error();
    } catch {
      setStatus('error');
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' as any },
    { header: 'Descripción', accessor: 'descripcion' as any },
    { header: 'Costo Unitario ($)', accessor: (item: any) => `$${item.costoUnitario.toFixed(2)}` },
    { header: 'Estado', accessor: (item: any) => (
      <Badge variant={item.activo ? "default" : "secondary"}>{item.activo ? 'Activo' : 'Inactivo'}</Badge>
    )},
  ];

  return (
    <>
      <GenericTable
        title="Catálogo de Acabados Especiales"
        description="Gestione procesos extra como etiquetado o empaquetado premium."
        data={data.map(d => ({...d, id: d._id}))}
        columns={columns}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Acabado' : 'Nuevo Acabado'}</DialogTitle>
            <DialogDescription>Defina el costo unitario del proceso extra.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...register('nombre')} placeholder="Ej: Empaquetado Premium" />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input {...register('descripcion')} placeholder="Ej: Bolsa individual con logo" />
              {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Costo Unitario ($)</Label>
              <Input type="number" step="0.01" {...register('costoUnitario', { valueAsNumber: true })} />
              {errors.costoUnitario && <p className="text-xs text-destructive">{errors.costoUnitario.message}</p>}
            </div>
            {status === 'error' && <p className="text-sm text-destructive">Error al guardar.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
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
export default AcabadosCatalog;
