/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GenericTable } from '@/components/GenericTable';
import { EstructuraCostos, CostoAdicional, FactorVolumen } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Info, Calculator, FileText, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const costoAdicionalSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  monto: z.number().min(0, "El monto no puede ser negativo"),
  tipo: z.enum(['Unitario', 'Distribuido']),
  activo: z.boolean()
});

const factorVolumenSchema = z.object({
  minUnidades: z.number().min(1, "Mínimo 1 unidad"),
  hastaUnidades: z.number().min(1, "Mínimo 1 unidad"),
  multiplicador: z.number().min(0.1, "Mínimo 0.1")
});

const recargosUrgenciaSchema = z.object({
  normal: z.number(),
  urgente: z.number(),
  planificada: z.number()
});

const estructuraSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  margenGanancia: z.number().min(0, "Mínimo 0%"),
  porcentajeComision: z.number().min(0, "Mínimo 0%"),
  iva: z.number().min(0, "Mínimo 0%"),
  ajusteComplejidadBajo: z.number().min(0, "Mínimo 0%"),
  ajusteComplejidadMedio: z.number().min(0, "Mínimo 0%"),
  ajusteComplejidadAlto: z.number().min(0, "Mínimo 0%"),
  costosAdicionales: z.array(costoAdicionalSchema),
  factoresVolumen: z.array(factorVolumenSchema),
  recargosUrgencia: recargosUrgenciaSchema,
  imagenReferencial: z.string().optional(),
  activo: z.boolean()
});

type EstructuraFormValues = z.infer<typeof estructuraSchema>;

const CostStructureCatalog: React.FC = () => {
  const { profile } = useAuth();
  const [data, setData] = useState<EstructuraCostos[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstructuraCostos | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check access level
  const currentRole = profile?.role ?? 4;
  const hasAccess = currentRole === 0 || currentRole === 1;

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<EstructuraFormValues>({
    resolver: zodResolver(estructuraSchema),
    defaultValues: {
      costosAdicionales: [],
      factoresVolumen: [],
      recargosUrgencia: {
        normal: 0,
        urgente: 10,
        planificada: -5
      },
      activo: true
    }
  });

  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({
    control,
    name: "costosAdicionales"
  });

  const { fields: volumeFields, append: appendVolume, remove: removeVolume } = useFieldArray({
    control,
    name: "factoresVolumen"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/catalogs/estructura-costos');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setValue('imagenReferencial', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (item?: EstructuraCostos) => {
    if (item) {
      setEditingItem(item);
      setImagePreview(item.imagenReferencial || null);
      reset({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        margenGanancia: item.margenGanancia,
        porcentajeComision: item.porcentajeComision,
        iva: item.iva,
        ajusteComplejidadBajo: item.ajusteComplejidadBajo,
        ajusteComplejidadMedio: item.ajusteComplejidadMedio,
        ajusteComplejidadAlto: item.ajusteComplejidadAlto,
        costosAdicionales: item.costosAdicionales,
        factoresVolumen: item.factoresVolumen,
        recargosUrgencia: item.recargosUrgencia || { normal: 0, urgente: 10, planificada: -5 },
        imagenReferencial: item.imagenReferencial || '',
        activo: item.activo
      });
    } else {
      setEditingItem(null);
      setImagePreview(null);
      reset({
        nombre: '',
        descripcion: '',
        margenGanancia: 25,
        porcentajeComision: 5,
        iva: 16,
        ajusteComplejidadBajo: 0,
        ajusteComplejidadMedio: 5,
        ajusteComplejidadAlto: 10,
        costosAdicionales: [
          { nombre: 'Empaque (Bolsa Plástica)', monto: 0.15, tipo: 'Unitario', activo: true },
          { nombre: 'Diseño Gráfico', monto: 50.00, tipo: 'Distribuido', activo: true },
          { nombre: 'Muestra Física', monto: 25.00, tipo: 'Distribuido', activo: true }
        ],
        factoresVolumen: [
          { minUnidades: 1, hastaUnidades: 19, multiplicador: 1.5 },
          { minUnidades: 20, hastaUnidades: 49, multiplicador: 1.3 },
          { minUnidades: 50, hastaUnidades: 99, multiplicador: 1.2 },
          { minUnidades: 100, hastaUnidades: 9999, multiplicador: 1.0 }
        ],
        recargosUrgencia: {
          normal: 0,
          urgente: 10,
          planificada: -5
        },
        imagenReferencial: '',
        activo: true
      });
    }
    setStatus('idle');
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: EstructuraFormValues) => {
    setStatus('loading');
    try {
      const url = editingItem ? `/api/catalogs/estructura-costos/${editingItem._id}` : '/api/catalogs/estructura-costos';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        fetchData();
        setTimeout(() => setIsModalOpen(false), 1000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Error saving:", error);
      setStatus('error');
    }
  };

  if (!hasAccess) {
    return <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-4">
        <Info className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold">Acceso Denegado</h2>
      <p className="text-muted-foreground mt-2">No tienes permisos para ver esta página.</p>
    </div>;
  }

  const handleDelete = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar la estructura "${item.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/catalogs/estructura-costos/${item._id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'nombre' as keyof EstructuraCostos },
    { header: 'Margen (%)', accessor: (item: EstructuraCostos) => `${item.margenGanancia}%` },
    { header: 'IVA (%)', accessor: (item: EstructuraCostos) => `${item.iva}%` },
    { header: 'Costos Adic.', accessor: (item: EstructuraCostos) => item.costosAdicionales.length },
    { header: 'Estado', accessor: (item: EstructuraCostos) => (
      <Badge variant={item.activo ? "default" : "secondary"}>
        {item.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estructura de Costos</h2>
          <p className="text-muted-foreground">Configuración de la lógica de negocio para presupuestos.</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus size={18} /> Nueva Estructura
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {isLoadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <GenericTable<EstructuraCostos>
              title="Modelos de Costos"
              description="Diferentes estructuras según el tipo de cliente o proyecto."
              data={data.map(d => ({ ...d, id: d._id }))}
              columns={columns}
              onAdd={() => openModal()}
              onEdit={openModal}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Guía Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p>Esta estructura define cómo se calculan los precios finales:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li><strong>Costo Base:</strong> (Tela + Confección + Corte).</li>
                <li><strong>Complejidad:</strong> Se añade el % según el modelo.</li>
                <li><strong>Adicionales:</strong> Se suman empaques y servicios.</li>
                <li><strong>Volumen:</strong> Se aplica multiplicador según cantidad.</li>
                <li><strong>Margen:</strong> Se aplica el beneficio deseado.</li>
                <li><strong>Impuestos:</strong> Se calcula el IVA final.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Calculator size={18} /> Simulación (Visual)
              </CardTitle>
              <CardDescription className="text-slate-400">Ejemplo de una camisa polo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Base (Diseño + Tela + Corte)</span>
                <span>$14.30</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Ajuste Complejidad (10%)</span>
                <span>+$1.43</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Adicionales (Empaque + Dist.)</span>
                <span>+$1.65</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1 text-slate-400 italic">
                <span>Subtotal Unitario</span>
                <span>$17.38</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-1">
                <span>Factor Volumen (Qty: 50 | 1.2x)</span>
                <span>$20.86</span>
              </div>
              <div className="flex justify-between font-bold text-green-400 pt-1 text-sm">
                <span>PRECIO NETO (+Margen 25%)</span>
                <span>$26.07</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText />
              {editingItem ? 'Editar Estructura' : 'Crear Estructura de Costos'}
            </DialogTitle>
            <DialogDescription>
              Defina las variables que controlan el precio de venta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="ajustes">Cargos</TabsTrigger>
                <TabsTrigger value="adicionales">Servicios</TabsTrigger>
                <TabsTrigger value="volumen">Volumen</TabsTrigger>
                <TabsTrigger value="urgencia">Urgencia</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-4 text-xs md:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la Estructura</Label>
                      <Input id="nombre" {...register('nombre')} placeholder="Ej: Corporativos" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea id="descripcion" {...register('descripcion')} className="h-20" placeholder="Uso administrativo..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="margenGanancia">Margen (%)</Label>
                        <Input id="margenGanancia" type="number" step="0.1" {...register('margenGanancia', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="iva">IVA (%)</Label>
                        <Input id="iva" type="number" step="0.1" {...register('iva', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 bg-slate-50 min-h-[200px]">
                    <Label className="text-center block mb-2 font-bold text-slate-600">Imagen Referencial</Label>
                    {imagePreview ? (
                      <div className="relative group w-full aspect-video rounded-md overflow-hidden bg-white border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                        <button 
                          type="button" 
                          onClick={() => { setImagePreview(null); setValue('imagenReferencial', ''); }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Plus className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-500">Subir imagen</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ajustes" className="space-y-4 pt-4">
                <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                   <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2 text-primary uppercase">
                    <Layers size={14} /> Ajustes por Complejidad (%)
                   </h4>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bajo</Label>
                        <Input type="number" {...register('ajusteComplejidadBajo', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Medio</Label>
                        <Input type="number" {...register('ajusteComplejidadMedio', { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Alto</Label>
                        <Input type="number" {...register('ajusteComplejidadAlto', { valueAsNumber: true })} />
                      </div>
                   </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                   <Label className="font-medium text-amber-800 mb-2 block">Comisión de Venta (%)</Label>
                    <Input type="number" step="0.1" {...register('porcentajeComision', { valueAsNumber: true })} />
                </div>
              </TabsContent>

              <TabsContent value="adicionales" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded">
                    <h4 className="font-bold text-xs uppercase text-slate-600">Servicios Adicionales</h4>
                    <Button type="button" size="xs" variant="default" onClick={() => appendCost({ nombre: '', monto: 0, tipo: 'Unitario', activo: true })}>
                      + Añadir
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {costFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="flex-[2]">
                          <Label className="text-[10px] text-slate-500">Nombre</Label>
                          <Input size={1} className="h-8" {...register(`costosAdicionales.${index}.nombre` as const)} placeholder="Empaque..." />
                        </div>
                        <div className="flex-1">
                          <Label className="text-[10px] text-slate-500">Monto</Label>
                          <Input type="number" step="0.01" className="h-8" {...register(`costosAdicionales.${index}.monto` as const, { valueAsNumber: true })} />
                        </div>
                        <div className="flex-1">
                          <Label className="text-[10px] text-slate-500">Tipo</Label>
                          <select 
                            {...register(`costosAdicionales.${index}.tipo` as const)}
                            className="w-full h-8 px-2 py-1 text-xs border rounded bg-white"
                          >
                            <option value="Unitario">Pieza</option>
                            <option value="Distribuido">Pedido</option>
                          </select>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCost(index)} className="text-destructive h-8 w-8">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="volumen" className="space-y-4 pt-4">
                 <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-100 p-2 rounded">
                    <h4 className="font-bold text-xs uppercase">Escalado por Volumen</h4>
                    <Button type="button" size="xs" onClick={() => appendVolume({ minUnidades: 1, hastaUnidades: 999, multiplicador: 1 })}>
                      + Rango
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 px-2 text-[10px] font-bold text-slate-500">
                      <div>DESDE</div>
                      <div>HASTA</div>
                      <div>FACTOR (x)</div>
                      <div className="text-right">ACCIONES</div>
                    </div>
                    {volumeFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-4 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                        <Input type="number" className="h-8 text-xs" {...register(`factoresVolumen.${index}.minUnidades` as const, { valueAsNumber: true })} />
                        <Input type="number" className="h-8 text-xs" {...register(`factoresVolumen.${index}.hastaUnidades` as const, { valueAsNumber: true })} />
                        <Input type="number" step="0.01" className="h-8 text-xs" {...register(`factoresVolumen.${index}.multiplicador` as const, { valueAsNumber: true })} />
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeVolume(index)} className="text-destructive h-8 w-8">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="urgencia" className="space-y-4 pt-4">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                      <Info className="text-blue-500 shrink-0" size={18} />
                      <p className="text-xs text-blue-700">Porcentajes de recargo o descuento según el tiempo de entrega solicitado.</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded border">
                        <div className="w-12 h-12 rounded bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                          <CheckCircle2 />
                        </div>
                        <div className="flex-1">
                          <Label className="font-bold">Planificada (Descuento)</Label>
                          <p className="text-[10px] text-muted-foreground">Para entregas con tiempo holgado.</p>
                        </div>
                        <div className="w-32 flex items-center gap-2">
                           <Input type="number" {...register('recargosUrgencia.planificada', { valueAsNumber: true })} />
                           <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded border">
                        <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <Calculator />
                        </div>
                        <div className="flex-1">
                          <Label className="font-bold">Ejecución Normal</Label>
                          <p className="text-[10px] text-muted-foreground">Tiempo de entrega estándar.</p>
                        </div>
                        <div className="w-32 flex items-center gap-2">
                           <Input type="number" {...register('recargosUrgencia.normal', { valueAsNumber: true })} />
                           <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-red-50 p-4 rounded border-red-100">
                        <div className="w-12 h-12 rounded bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                          <Plus className="rotate-45" />
                        </div>
                        <div className="flex-1">
                          <Label className="font-bold text-red-800">Urgente (Recargo)</Label>
                          <p className="text-[10px] text-red-600">Prioridad máxima de producción.</p>
                        </div>
                        <div className="w-32 flex items-center gap-2">
                           <Input type="number" {...register('recargosUrgencia.urgente', { valueAsNumber: true })} className="border-red-200" />
                           <span className="font-bold text-red-500">%</span>
                        </div>
                      </div>
                   </div>
                </div>
              </TabsContent>
            </Tabs>

            {status === 'error' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Ocurrió un error al guardar. Revise los campos.
              </div>
            )}

            <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === 'success' ? '¡Guardado!' : (editingItem ? 'Actualizar' : 'Guardar Estructura')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CostStructureCatalog;
