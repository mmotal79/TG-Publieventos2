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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  tipoPrenda: z.string().min(1, "El tipo de prenda es requerido"),
  nivelComplejidad: z.enum(['Bajo', 'Medio', 'Alto']),
  costoBase: z.number().min(0, "Debe ser positivo"),
  factorComplejidad: z.number().min(1, "Debe ser al menos 1.0"),
  tiempoEstimadoMinutos: z.number().min(1, "El tiempo debe ser mayor a 0"),
  activo: z.boolean()
});

type FormValues = z.infer<typeof schema>;

const ModelosCatalog: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nivelComplejidad: 'Medio', costoBase: 0, factorComplejidad: 1.0, activo: true }
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/catalogs/modelos');
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
      reset({ tipoPrenda: '', nivelComplejidad: 'Medio', costoBase: 0, factorComplejidad: 1.0, tiempoEstimadoMinutos: 0, activo: true });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/modelos/${editingItem._id}` : '/api/catalogs/modelos';
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

  const handleDelete = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar el modelo "${item.tipoPrenda}"?`)) return;
    try {
      const res = await fetch(`/api/catalogs/modelos/${item._id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'Tipo de Prenda', accessor: 'tipoPrenda' as any },
    { header: 'Complejidad', accessor: 'nivelComplejidad' as any },
    { header: 'Costo Base ($)', accessor: 'costoBase' as any },
    { header: 'Factor', accessor: 'factorComplejidad' as any },
    { header: 'Tiempo (min)', accessor: 'tiempoEstimadoMinutos' as any },
    { header: 'Estado', accessor: (item: any) => (
      <Badge variant={item.activo ? "default" : "secondary"}>{item.activo ? 'Activo' : 'Inactivo'}</Badge>
    )},
  ];

  return (
    <>
      <GenericTable
        title="Catálogo de Modelos"
        description="Gestione los modelos de prendas y sus tiempos de confección."
        data={data.map(d => ({...d, id: d._id}))}
        columns={columns}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Modelo' : 'Nuevo Modelo'}</DialogTitle>
            <DialogDescription>Defina los parámetros de confección del modelo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Prenda</Label>
              <Input {...register('tipoPrenda')} placeholder="Ej: Camisa Polo" />
              {errors.tipoPrenda && <p className="text-xs text-destructive">{errors.tipoPrenda.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel de Complejidad</Label>
                <Select value={watch('nivelComplejidad')} onValueChange={(v: any) => setValue('nivelComplejidad', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bajo">Bajo</SelectItem>
                    <SelectItem value="Medio">Medio</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Costo Base ($)</Label>
                <Input type="number" step="0.01" {...register('costoBase', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Factor Complejidad</Label>
                <Input type="number" step="0.1" {...register('factorComplejidad', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Tiempo (Minutos)</Label>
                <Input type="number" {...register('tiempoEstimadoMinutos', { valueAsNumber: true })} />
              </div>
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
export default ModelosCatalog;
