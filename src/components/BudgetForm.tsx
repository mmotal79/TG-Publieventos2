/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calculator, UserPlus, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientFormModal } from './ClientFormModal';
import { formatCurrency } from '@/services/budgetService';
import { Client, Tela, Modelo, Corte, EstructuraCostos, Budget } from '@/types';

const budgetItemSchema = z.object({
  id: z.string(),
  modeloId: z.string().min(1, "Requerido"),
  telaId: z.string().min(1, "Requerido"),
  corteId: z.string().min(1, "Requerido"),
  personalizacion: z.number().min(0),
  acabados: z.number().min(0),
  cantidad: z.number().min(1),
});

const budgetSchema = z.object({
  clientId: z.string().min(1, "Seleccione un cliente"),
  estructuraCostosId: z.string().min(1, "Seleccione una estructura"),
  urgencia: z.enum(['normal', 'urgente', 'planificada']),
  description: z.string().min(1, "Ingrese una descripción"),
  items: z.array(budgetItemSchema).min(1, "Agregue al menos un item"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  initialData?: any;
  onCancel?: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [estructuras, setEstructuras] = useState<EstructuraCostos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: initialData || {
      urgencia: "normal",
      items: [{ id: crypto.randomUUID(), modeloId: '', telaId: '', corteId: '', personalizacion: 0, acabados: 0, cantidad: 12 }]
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const watchedEstructuraId = watch("estructuraCostosId");
  const watchedUrgencia = watch("urgencia");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, tRes, mRes, crRes, ecRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/catalogs/telas'),
          fetch('/api/catalogs/modelos'),
          fetch('/api/catalogs/cortes'),
          fetch('/api/catalogs/estructura-costos')
        ]);
        
        if (cRes.ok) {
          const clientData: Client[] = await cRes.json();
          setClients(clientData.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
        }
        if (tRes.ok) setTelas(await tRes.json());
        if (mRes.ok) setModelos(await mRes.json());
        if (crRes.ok) setCortes(await crRes.json());
        if (ecRes.ok) setEstructuras(await ecRes.json());
      } catch (err) {
        console.error("Error loading catalogs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedEstructura = useMemo(() => 
    estructuras.find(e => e._id === watchedEstructuraId),
    [estructuras, watchedEstructuraId]
  );

  const itemCalculations = useMemo(() => {
    if (!selectedEstructura) return [];

    return watchedItems.map(item => {
      const modelo = modelos.find(m => m._id === item.modeloId);
      const tela = telas.find(t => t._id === item.telaId);
      const corte = cortes.find(c => c._id === item.corteId);

      if (!modelo || !tela || !corte) return { unit: 0, total: 0 };

      // Total_Item = (((Costo_Tela * Factor_Corte) + (Costo_Modelo * Factor_Complejidad) + Costos_Personalización + Acabados) * Factor_Volumen) * Recargo_Urgencia
      
      const Costo_Tela = tela.costoPorMetro;
      const Factor_Corte = corte.factorConsumoTela;
      const Costo_Modelo = modelo.costoBase || 0;
      const Factor_Complejidad = modelo.factorComplejidad || 1.0;

      // Base: (Costo_Tela * Factor_Corte) + (Costo_Modelo * Factor_Complejidad) + Personalización + Acabados
      const baseCost = (Costo_Tela * Factor_Corte) + (Costo_Modelo * Factor_Complejidad) + (item.personalizacion || 0) + (item.acabados || 0);

      // Factor Volumen
      let factorVolumen = 1.0;
      const range = selectedEstructura.factoresVolumen.find(f => 
        item.cantidad >= f.minUnidades && item.cantidad <= f.hastaUnidades
      );
      if (range) factorVolumen = range.multiplicador;

      // Recargo Urgencia
      const recargos = selectedEstructura.recargosUrgencia;
      let recargoUrgent = 0;
      if (watchedUrgencia === 'urgente') recargoUrgent = recargos.urgente;
      else if (watchedUrgencia === 'planificada') recargoUrgent = recargos.planificada;
      else recargoUrgent = recargos.normal;

      const urgencyMultiplier = 1 + (recargoUrgent / 100);

      // Margen de ganancia de la estructura
      const totalConMargen = baseCost * (1 + (selectedEstructura.margenGanancia / 100));

      const precioUnitario = (totalConMargen * factorVolumen) * urgencyMultiplier;
      
      return {
        unit: precioUnitario,
        total: precioUnitario * item.cantidad
      };
    });
  }, [watchedItems, selectedEstructura, watchedUrgencia, modelos, telas, cortes]);

  const grandTotal = useMemo(() => 
    itemCalculations.reduce((acc, curr) => acc + curr.total, 0),
    [itemCalculations]
  );

  const onSubmit = async (data: BudgetFormValues) => {
    setIsLoading(true);
    // Inject calculated values
    const finalBudget = {
      ...data,
      items: data.items.map((item, idx) => ({
        ...item,
        precioUnitario: itemCalculations[idx].unit,
        totalItem: itemCalculations[idx].total
      })),
      totalCost: grandTotal,
      status: 'pending',
      fecha: new Date().toISOString()
    };
    
    try {
      const url = initialData?._id ? `/api/budgets/${initialData._id}` : '/api/budgets';
      const method = initialData?._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBudget)
      });
      
      if (res.ok) {
        alert(initialData?._id ? "Presupuesto actualizado exitosamente" : "Presupuesto guardado exitosamente");
        if (onCancel) onCancel();
        else window.location.reload();
      } else {
        const err = await res.json();
        alert(err.message || "Error al guardar presupuesto");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Error de conexión al servidor");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500">Configuración de Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(v: string) => setValue("clientId", v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Buscar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c._id} value={c._id!}>{c.razonSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsClientModalOpen(true)}>
                    <UserPlus size={18} />
                  </Button>
                </div>
                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Estructura de Costos</Label>
                <Select onValueChange={(v: string) => setValue("estructuraCostosId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione lógica..." />
                  </SelectTrigger>
                  <SelectContent>
                    {estructuras.map(e => (
                      <SelectItem key={e._id} value={e._id!}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.estructuraCostosId && <p className="text-xs text-destructive">{errors.estructuraCostosId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Nivel de Urgencia</Label>
                <Select defaultValue="normal" onValueChange={(v: any) => setValue("urgencia", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planificada">Planificada (Descuento)</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgente">Urgente (Recargo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descripción / Referencia</Label>
                <Input {...register("description")} placeholder="Ej: Uniformes Evento Mayo" />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
            </CardContent>
          </Card>

          {selectedEstructura && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Margen de Estructura:</span>
                  <span className="font-bold">{selectedEstructura.margenGanancia}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">IVA:</span>
                  <span className="font-bold">{selectedEstructura.iva}%</span>
                </div>
                <div className="flex justify-between border-t border-blue-100 pt-1">
                  <span className="text-blue-700">Factor Volumen Activo:</span>
                  <span className="font-bold text-blue-900">
                    {itemCalculations[0]?.unit > 0 ? "Aplicado" : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Líneas de Producción
              <Badge variant="outline" className="ml-2">{fields.length}</Badge>
            </h3>
            <Button type="button" variant="default" size="sm" onClick={() => append({ id: crypto.randomUUID(), modeloId: '', telaId: '', corteId: '', personalizacion: 0, acabados: 0, cantidad: 12 })}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4 md:p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">Item #{index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(index)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Modelo / Prenda</Label>
                      <Select onValueChange={(v: string) => setValue(`items.${index}.modeloId`, v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {modelos.map(m => (
                            <SelectItem key={m._id} value={m._id}>{m.tipoPrenda} ({m.nivelComplejidad})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Tela / Material</Label>
                      <Select onValueChange={(v: string) => setValue(`items.${index}.telaId`, v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {telas.map(t => (
                            <SelectItem key={t._id} value={t._id}>{t.nombre} (${t.costoPorMetro}/m)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold">Corte / Consumo</Label>
                      <Select onValueChange={(v: string) => setValue(`items.${index}.corteId`, v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cortes.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.nombre} ({c.factorConsumoTela}m)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2 lg:col-span-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Personalización ($)</Label>
                        <Input type="number" step="0.01" className="h-9" {...register(`items.${index}.personalizacion`, { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Acabados ($)</Label>
                        <Input type="number" step="0.01" className="h-9" {...register(`items.${index}.acabados`, { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Cantidad (Unds)</Label>
                        <Input type="number" className="h-9 border-primary/50" {...register(`items.${index}.cantidad`, { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center text-sm">
                    <span className="text-muted-foreground italic flex items-center gap-1">
                      <Info size={12} /> Unitario: {formatCurrency(itemCalculations[index]?.unit || 0)}
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(itemCalculations[index]?.total || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900 text-white shadow-xl sticky bottom-4 z-10 mx-[-1rem] md:mx-0">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Subtotal Presupuestado</p>
                  <p className="text-4xl font-black">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button type="button" variant="outline" className="flex-1 bg-white/5 border-white/20 hover:bg-white/10" onClick={() => window.location.reload()}>
                  Limpiar
                </Button>
                <Button type="submit" size="lg" className="flex-[2] md:flex-none md:min-w-[200px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                  Generar Presupuesto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSuccess={(newClient) => {
          setClients(prev => [...prev, newClient].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
          setValue("clientId", newClient._id!);
        }}
      />
    </form>
  );
};

export default BudgetForm;
