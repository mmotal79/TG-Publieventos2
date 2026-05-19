/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { CreacionItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';

const creacionSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  precioBase: z.coerce.number().min(1, "El precio base debe ser mayor a 0"),
  activo: z.boolean().default(true),
});

type CreacionFormValues = z.infer<typeof creacionSchema>;

const CreacionesCatalog: React.FC = () => {
  const [data, setData] = useState<CreacionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreacionItem | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreacionFormValues>({
    resolver: zodResolver(creacionSchema) as any,
    defaultValues: {
      titulo: '',
      descripcion: '',
      precioBase: 0,
      activo: true
    }
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/catalogs/creaciones');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (item?: CreacionItem) => {
    if (item) {
      setEditingItem(item);
      setSelectedImage(item.imagen);
      reset({
        titulo: item.titulo,
        descripcion: item.descripcion,
        precioBase: item.precioBase,
        activo: item.activo
      });
    } else {
      setEditingItem(null);
      setSelectedImage(null);
      reset({
        titulo: '',
        descripcion: '',
        precioBase: 0,
        activo: true
      });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: CreacionFormValues) => {
    if (!selectedImage) {
      alert("La imagen es obligatoria");
      return;
    }
    
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/creaciones/${editingItem._id}` : '/api/catalogs/creaciones';
    const method = editingItem ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, imagen: selectedImage })
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
    if (!confirm(`¿Está seguro de eliminar esta creación?`)) return;
    try {
      const res = await fetch(`/api/catalogs/creaciones/${item._id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { 
      header: 'Vista Previa', 
      accessor: (item: CreacionItem) => (
        <div className="w-16 h-16 rounded-xl overflow-hidden border bg-slate-50">
           <img src={item.imagen} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )
    },
    { header: 'Título', accessor: 'titulo' as keyof CreacionItem },
    { 
      header: 'Precio Base', 
      accessor: (item: CreacionItem) => (
        <span className="font-bold text-primary">
          ${(item.precioBase || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Estado', 
      accessor: (item: CreacionItem) => (
        <Badge variant={item.activo ? "default" : "secondary"}>
          {item.activo ? 'Visible' : 'Oculto'}
        </Badge>
      )
    },
  ];

  const activoVal = watch('activo');

  return (
    <div className="p-6">
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <GenericTable<CreacionItem>
          title="Nuestras Creaciones"
          description="Gestione las piezas exclusivas que se muestran en el carrusel del Landing Page."
          data={data.map(d => ({ ...d, id: d._id }))}
          columns={columns}
          onAdd={() => openModal()}
          onEdit={(item) => openModal(item)}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {editingItem ? 'Editar Creación' : 'Nueva Creación'}
              </div>
            </DialogTitle>
            <DialogDescription>
              Añada una prenda al catálogo de exhibición pública.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="titulo">Título de la Creación</Label>
                <Input id="titulo" {...register('titulo')} placeholder="Ej: Camisa Slim Fit Premium" />
                {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="precioBase">Precio Base sugerido (USD)</Label>
                <Input id="precioBase" type="number" step="0.01" {...register('precioBase')} placeholder="0.00" />
                {errors.precioBase && <p className="text-xs text-destructive">{errors.precioBase.message}</p>}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 h-fit self-end">
                <div className="space-y-0.5">
                  <Label className="text-sm">Visible en Landing</Label>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Activar en carrusel</p>
                </div>
                <Switch 
                  checked={activoVal}
                  onCheckedChange={(checked) => setValue('activo', checked)}
                />
              </div>

              <div className="col-span-2 space-y-4">
                <Label>Imagen del Producto</Label>
                <div className="flex flex-col items-center gap-4">
                  {selectedImage ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary/20 bg-slate-50">
                      <img src={selectedImage} className="w-full h-full object-contain" alt="Preview" />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedImage(null)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                      <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
                      <span className="text-sm font-medium text-slate-500">Subir Fotografía</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleImageChange} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción Detallada</Label>
                <Textarea 
                  id="descripcion" 
                  {...register('descripcion')} 
                  placeholder="Detalle los materiales, técnicas de costura y acabados..."
                  className="min-h-[120px]"
                />
                {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Ocurrió un error al guardar. Verifique los campos.
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" className="px-8" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'success' ? 'Guardado' : 'Publicar Creación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreacionesCatalog;
