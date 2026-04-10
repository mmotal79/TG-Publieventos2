/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  factorConsumoTela: z.number().min(0.1, "Debe ser mayor a 0"),
  factorTiempoConfeccion: z.number().min(0.1, "Debe ser mayor a 0")
});

type FormValues = z.infer<typeof schema>;

const CortesCatalog: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/catalogs/cortes');
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
      reset({ nombre: '', factorConsumoTela: 1, factorTiempoConfeccion: 1 });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: FormValues) => {
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/cortes/${editingItem._id}` : '/api/catalogs/cortes';
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
    { header: 'Nombre del Corte', accessor: 'nombre' as any },
    { header: 'Factor Consumo Tela', accessor: 'factorConsumoTela' as any },
    { header: 'Factor Tiempo', accessor: 'factorTiempoConfeccion' as any }
  ];

  return (
    <>
      <GenericTable
        title="Catálogo de Cortes"
        description="Gestione los tipos de corte y sus factores multiplicadores."
        data={data.map(d => ({...d, id: d._id}))}
        columns={columns}
        onAdd={() => openModal()}
        onEdit={(item) => openModal(item)}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Corte' : 'Nuevo Corte'}</DialogTitle>
            <DialogDescription>Defina los factores multiplicadores para el cálculo técnico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Corte</Label>
              <Input {...register('nombre')} placeholder="Ej: Corte Princesa" />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Factor Consumo de Tela (Ej: 1.1 = +10%)</Label>
              <Input type="number" step="0.01" {...register('factorConsumoTela', { valueAsNumber: true })} />
              {errors.factorConsumoTela && <p className="text-xs text-destructive">{errors.factorConsumoTela.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Factor Tiempo de Confección (Ej: 1.2 = +20%)</Label>
              <Input type="number" step="0.01" {...register('factorTiempoConfeccion', { valueAsNumber: true })} />
              {errors.factorTiempoConfeccion && <p className="text-xs text-destructive">{errors.factorTiempoConfeccion.message}</p>}
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
export default CortesCatalog;
