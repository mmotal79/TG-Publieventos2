/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { PortafolioItem, Client } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image as ImageIcon, Briefcase } from 'lucide-react';

const portafolioSchema = z.object({
  clienteId: z.string().min(1, "El cliente es requerido"),
  nombreCliente: z.string().min(1, "El nombre del cliente es requerido"),
  comentario: z.string().optional(),
  activo: z.boolean().default(true),
  mostrarTestimonio: z.boolean().default(true),
});

type PortafolioFormValues = z.infer<typeof portafolioSchema>;

const PortafolioCatalog: React.FC = () => {
  const [data, setData] = useState<PortafolioItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortafolioItem | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PortafolioFormValues>({
    resolver: zodResolver(portafolioSchema) as any,
    defaultValues: {
      clienteId: '',
      nombreCliente: '',
      comentario: '',
      activo: true,
      mostrarTestimonio: true
    }
  });

  const clienteId = watch('clienteId');

  useEffect(() => {
    if (clienteId) {
      const client = clients.find(c => c._id === clienteId);
      if (client) {
        setValue('nombreCliente', client.razonSocial);
      }
    }
  }, [clienteId, clients, setValue]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/catalogs/portafolio'),
        fetch('/api/clients')
      ]);
      
      if (pRes.ok) setData(await pRes.json());
      if (cRes.ok) setClients(await cRes.json());
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

  const openModal = (item?: PortafolioItem) => {
    if (item) {
      setEditingItem(item);
      setSelectedImage(item.imagen);
      reset({
        clienteId: item.clienteId,
        nombreCliente: item.nombreCliente,
        comentario: item.comentario,
        activo: item.activo,
        mostrarTestimonio: item.mostrarTestimonio
      });
    } else {
      setEditingItem(null);
      setSelectedImage(null);
      reset({
        clienteId: '',
        nombreCliente: '',
        comentario: '',
        activo: true,
        mostrarTestimonio: true
      });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: PortafolioFormValues) => {
    if (!selectedImage) {
      alert("La imagen es obligatoria");
      return;
    }
    
    setStatus('loading');
    const url = editingItem ? `/api/catalogs/portafolio/${editingItem._id}` : '/api/catalogs/portafolio';
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
    if (!confirm(`¿Está seguro de eliminar esta pieza del portafolio?`)) return;
    try {
      const res = await fetch(`/api/catalogs/portafolio/${item._id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { 
      header: 'Imagen', 
      accessor: (item: PortafolioItem) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden border">
           <img src={item.imagen} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )
    },
    { header: 'Cliente', accessor: 'nombreCliente' as keyof PortafolioItem },
    { 
      header: 'Testimonio', 
      accessor: (item: PortafolioItem) => (
        <div className="max-w-xs truncate italic">
          {item.comentario || 'N/A'}
        </div>
      )
    },
    { 
      header: 'Visible en Landing', 
      accessor: (item: PortafolioItem) => (
        <Badge variant={item.activo ? "default" : "secondary"}>
          {item.activo ? 'Sí' : 'No'}
        </Badge>
      )
    },
    { 
      header: 'Mostrar Comentario', 
      accessor: (item: PortafolioItem) => (
        <Badge variant={item.mostrarTestimonio ? "outline" : "secondary"}>
          {item.mostrarTestimonio ? 'Sí' : 'No'}
        </Badge>
      )
    },
  ];

  const activoVal = watch('activo');
  const mostrarTestimonioVal = watch('mostrarTestimonio');

  return (
    <div className="p-6">
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <GenericTable<PortafolioItem>
          title="Administración de Portafolio"
          description="Gestione las muestras de trabajo y testimonios proyectados en el Landing Page."
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
                <Briefcase className="w-5 h-5 text-primary" />
                {editingItem ? 'Editar Pieza' : 'Nueva Pieza de Portafolio'}
              </div>
            </DialogTitle>
            <DialogDescription>
              Vincule una entrega a un cliente y configure su visibilidad pública.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Vincular Cliente</Label>
                <Select 
                  value={clienteId} 
                  onValueChange={(val) => setValue('clienteId', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c._id} value={c._id!}>{c.razonSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreCliente">Nombre a Mostrar</Label>
                <Input id="nombreCliente" {...register('nombreCliente')} placeholder="Ej: Uniformes Globales S.A." />
                {errors.nombreCliente && <p className="text-xs text-destructive">{errors.nombreCliente.message}</p>}
              </div>

              <div className="col-span-2 space-y-4">
                <Label>Imagen de la Entrega (Catálogo)</Label>
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
                      <span className="text-sm font-medium text-slate-500">Subir Fotografía de Entrega</span>
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
                <Label htmlFor="comentario">Testimonio / Comentarios del Cliente</Label>
                <Textarea 
                  id="comentario" 
                  {...register('comentario')} 
                  placeholder="Observaciones de la entrega o palabras del cliente..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm">Visible en Landing</Label>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Activar en carrusel frontal</p>
                </div>
                <Switch 
                  checked={activoVal}
                  onCheckedChange={(checked) => setValue('activo', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm">Mostrar Testimonio</Label>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Desplegar texto de observación</p>
                </div>
                <Switch 
                  checked={mostrarTestimonioVal}
                  onCheckedChange={(checked) => setValue('mostrarTestimonio', checked)}
                />
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
                {status === 'success' ? 'Guardado' : 'Publicar en Portafolio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortafolioCatalog;
