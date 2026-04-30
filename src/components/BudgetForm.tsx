/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calculator, UserPlus, Info, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientFormModal } from './ClientFormModal';
import { formatCurrency } from '@/services/budgetService';
import { cn } from '@/lib/utils';
import { Client, Tela, Modelo, Corte, EstructuraCostos, Budget } from '@/types';
import BudgetPreviewDialog from './BudgetPreviewDialog';

const budgetItemSchema = z.object({
  id: z.string(),
  modeloId: z.string().min(1, "Requerido"),
  telaId: z.string().min(1, "Requerido"),
  corteId: z.string().min(1, "Requerido"),
  personalizacion: z.number().min(0).optional().default(0),
  acabados: z.number().min(0).optional().default(0),
  cantidad: z.number().min(1),
});

const budgetSchema = z.object({
  clientId: z.string().min(1, "Seleccione un cliente"),
  estructuraCostosId: z.string().min(1, "Seleccione una estructura"),
  urgencia: z.enum(['normal', 'urgente', 'planificada']),
  description: z.string().min(1, "Ingrese una descripción"),
  observations: z.string().optional(),
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: initialData || {
      urgencia: "normal",
      items: [{ id: crypto.randomUUID(), modeloId: '', telaId: '', corteId: '', personalizacion: 0, acabados: 0, cantidad: 12 }]
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        observations: initialData.observations || initialData.notes || ""
      });
    }
  }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = useWatch({ control, name: "items" }) || [];
  const watchedEstructuraId = useWatch({ control, name: "estructuraCostosId" });
  const watchedUrgencia = useWatch({ control, name: "urgencia" });

  const watchedClientId = useWatch({ control, name: "clientId" });

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
          const clientData = await cRes.json();
          setClients(clientData.sort((a: Client, b: Client) => a.razonSocial.localeCompare(b.razonSocial)));
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
  const selectedClient = useMemo(() => 
    clients.find(c => c._id === watchedClientId),
    [clients, watchedClientId]
  );

  const selectedEstructura = useMemo(() => 
    estructuras.find(e => e._id === watchedEstructuraId),
    [estructuras, watchedEstructuraId]
  );

  const { itemCalculations, volumeDiscountInfo } = useMemo(() => {
    if (!selectedEstructura) {
      return { 
        itemCalculations: watchedItems.map(() => ({ unit: 0, total: 0, baseUnit: 0 })),
        volumeDiscountInfo: { hasDiscount: false, amount: 0, percent: 0 }
      };
    }

    let totalSavingsAccumulator = 0;
    let totalBaseAmountAccumulator = 0;

    const calculations = watchedItems.map(item => {
      const modelo = modelos.find(m => m._id === item.modeloId);
      const tela = telas.find(t => t._id === item.telaId);
      const corte = cortes.find(c => c._id === item.corteId);

      if (!modelo || !tela || !corte) return { unit: 0, total: 0, baseUnit: 0 };

      const Costo_Tela = tela.costoPorMetro || 0;
      const Factor_Corte = corte.factorConsumoTela || 0;
      const Costo_Modelo = modelo.costoBase || 0;
      const Factor_Complejidad = modelo.factorComplejidad || 1.0;
      const personalizacion = isNaN(item.personalizacion) ? 0 : (item.personalizacion || 0);
      const acabados = isNaN(item.acabados) ? 0 : (item.acabados || 0);
      const cantidad = isNaN(item.cantidad) ? 0 : (item.cantidad || 0);

      if (cantidad <= 0) return { unit: 0, total: 0, baseUnit: 0 };

      const baseCost = (Costo_Tela * Factor_Corte) + (Costo_Modelo * Factor_Complejidad) + personalizacion + acabados;
      const margen = selectedEstructura.margenGanancia || 0;
      const totalConMargen = baseCost * (1 + (margen / 100));

      const recargos = selectedEstructura.recargosUrgencia || { normal: 0, urgente: 0, planificada: 0 };
      const recargoUrgent = watchedUrgencia === 'urgente' ? (recargos.urgente || 0) : 
                          watchedUrgencia === 'planificada' ? (recargos.planificada || 0) : 
                          (recargos.normal || 0);
      const urgencyMultiplier = 1 + (recargoUrgent / 100);

      // Current Volume Factor
      let factorVolumen = 1.0;
      if (selectedEstructura.factoresVolumen) {
        const range = selectedEstructura.factoresVolumen.find(f => 
          cantidad >= f.minUnidades && cantidad <= f.hastaUnidades
        );
        if (range) factorVolumen = range.multiplicador;
      }

      // 1-Unit Volume Factor (Reference)
      let factorVolumenOne = 1.0;
      if (selectedEstructura.factoresVolumen) {
        const rangeOne = selectedEstructura.factoresVolumen.find(f => 
          1 >= f.minUnidades && 1 <= f.hastaUnidades
        );
        if (rangeOne) factorVolumenOne = rangeOne.multiplicador;
      }

      const baseUnitPrice = totalConMargen * urgencyMultiplier * factorVolumenOne;
      const precioUnitario = (totalConMargen * urgencyMultiplier) * factorVolumen;

      const lineSavings = (baseUnitPrice - precioUnitario) * cantidad;
      totalSavingsAccumulator += Math.max(0, lineSavings);
      totalBaseAmountAccumulator += baseUnitPrice * cantidad;
      
      return {
        unit: isNaN(precioUnitario) ? 0 : precioUnitario,
        total: isNaN(precioUnitario * cantidad) ? 0 : precioUnitario * cantidad,
        baseUnit: isNaN(baseUnitPrice) ? 0 : baseUnitPrice
      };
    });

    const percentResult = totalBaseAmountAccumulator > 0 ? Math.round((totalSavingsAccumulator / totalBaseAmountAccumulator) * 100) : 0;
    
    return {
      itemCalculations: calculations,
      volumeDiscountInfo: {
        hasDiscount: totalSavingsAccumulator > 0.01,
        amount: totalSavingsAccumulator,
        percent: percentResult
      }
    };
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
      volumeDiscountAmount: volumeDiscountInfo.amount,
      volumeDiscountPercent: volumeDiscountInfo.percent,
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
      {/* Top Section: General Info & Totalizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="clientId"
                    render={({ field }) => (
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="budgets-client-select" className="flex-1">
                          <SelectValue placeholder="Seleccionar cliente...">
                            {clients.find(c => c._id === field.value)?.razonSocial}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c._id} value={c._id!}>{c.razonSocial}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => setIsClientModalOpen(true)}>
                    <UserPlus size={18} />
                  </Button>
                </div>
                {selectedClient && (
                  <div className="text-[10px] bg-slate-50 p-2 rounded border mt-2 flex flex-wrap gap-x-4">
                    <span><strong>Email:</strong> {selectedClient.email}</span>
                    <span><strong>Tel:</strong> {selectedClient.telefono}</span>
                    <span><strong>NIT:</strong> {selectedClient.nit}</span>
                  </div>
                )}
                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Estructura de Costos</Label>
                <Controller
                  control={control}
                  name="estructuraCostosId"
                  render={({ field }) => (
                    <Select 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="budgets-structure-select">
                        <SelectValue placeholder="Seleccione lógica de cálculo...">
                          {estructuras.find(e => e._id === field.value)?.nombre}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {estructuras.map(e => (
                          <SelectItem key={e._id} value={e._id!}>{e.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {selectedEstructura && (
                  <div className="text-[10px] bg-blue-50 p-2 rounded border border-blue-100 text-blue-700 mt-2">
                    Margen: {selectedEstructura.margenGanancia}% | IVA: {selectedEstructura.iva}%
                  </div>
                )}
                {errors.estructuraCostosId && <p className="text-xs text-destructive">{errors.estructuraCostosId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descripción del Proyecto</Label>
                <Input {...register("description")} placeholder="Ej: Uniformes Corporativos para Evento Anual" />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Notas de la Solicitud (Comentarios del cliente)</Label>
                <Input {...register("observations")} placeholder="Ej: Reclamo por entrega anterior, requiere bordado extra..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800 text-white flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-xs uppercase tracking-widest font-black flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Resumen del Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden px-2 min-h-[140px] flex flex-col justify-center">
              <p className={cn(
                "font-black text-white drop-shadow-[0_2px_15px_rgba(255,255,255,0.3)] transition-all duration-300 break-all leading-tight",
                grandTotal.toString().length > 16 ? "text-xl" :
                grandTotal.toString().length > 14 ? "text-2xl" :
                grandTotal.toString().length > 12 ? "text-3xl" : 
                grandTotal.toString().length > 10 ? "text-4xl" : "text-5xl"
              )}>
                {formatCurrency(grandTotal)}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest opacity-80">Total Estimado (Inc. Margen)</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-2">
                  <Label className="text-white text-[10px] font-bold uppercase tracking-widest opacity-60">Nivel de Urgencia</Label>
                  <Controller
                    control={control}
                    name="urgencia"
                    render={({ field }) => (
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 transition-all hover:bg-slate-700">
                          <SelectValue>
                            {field.value === 'planificada' ? '🕒 Planificada' : 
                             field.value === 'normal' ? '✅ Normal' : 
                             field.value === 'urgente' ? '🔥 Urgente' : ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planificada">🕒 Planificada</SelectItem>
                          <SelectItem value="normal">✅ Normal</SelectItem>
                          <SelectItem value="urgente">🔥 Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-[10px] font-black uppercase tracking-widest opacity-60 flex justify-between">
                    <span>DESC. X VOLUMEN: {volumeDiscountInfo.hasDiscount ? `-${volumeDiscountInfo.percent}%` : ''}</span>
                  </Label>
                  <div className="bg-slate-800 border border-slate-700 text-white h-9 flex items-center px-3 rounded-md transition-all shadow-inner group overflow-hidden">
                    {volumeDiscountInfo.hasDiscount ? (
                      <span className="text-sm font-bold text-emerald-400 group-hover:scale-105 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-1">
                        {formatCurrency(volumeDiscountInfo.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[10px] w-full text-center opacity-50">No aplica</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 hover:bg-white/10 hover:text-white flex items-center gap-2"
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={watchedItems.length === 0 || !watchedClientId || !watchedEstructuraId}
                >
                  <Eye size={16} /> Visualizar Presupuesto
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 hover:text-white" 
                    onClick={() => onCancel ? onCancel() : window.location.reload()}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold">
                    {initialData?._id ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Table Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Detalle del Pedido</CardTitle>
            <p className="text-xs text-muted-foreground">Especifique modelos, materiales y cantidades.</p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="gap-2 border-primary text-primary hover:bg-primary/10 transition-all font-bold"
            onClick={() => append({ id: crypto.randomUUID(), modeloId: '', telaId: '', corteId: '', personalizacion: 0, acabados: 0, cantidad: 12 })}
          >
            <Plus size={16} /> Nuevo Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Modelo / Prenda</th>
                  <th className="px-4 py-3 min-w-[200px]">Tela / Material</th>
                  <th className="px-4 py-3 min-w-[150px]">Corte / Consumo</th>
                  <th className="px-4 py-3 min-w-[120px]">Pers. ($)</th>
                  <th className="px-4 py-3 min-w-[120px]">Acab. ($)</th>
                  <th className="px-4 py-3 min-w-[100px]">Cant.</th>
                  <th className="px-4 py-3 text-right">Unitario</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Controller
                        control={control}
                        name={`items.${index}.modeloId`}
                        render={({ field }) => (
                          <Select 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200 transition-all">
                              <SelectValue placeholder="Modelo...">
                                {modelos.find(m => m._id === field.value)?.tipoPrenda}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelos.map(m => (
                                <SelectItem key={m._id} value={m._id}>{m.tipoPrenda} ({m.nivelComplejidad})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Controller
                        control={control}
                        name={`items.${index}.telaId`}
                        render={({ field }) => (
                          <Select 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200 transition-all">
                              <SelectValue placeholder="Tela...">
                                {telas.find(t => t._id === field.value)?.nombre}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {telas.map(t => (
                                <SelectItem key={t._id} value={t._id}>{t.nombre} (${t.costoPorMetro})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Controller
                        control={control}
                        name={`items.${index}.corteId`}
                        render={({ field }) => (
                          <Select 
                            value={field.value || ""} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-slate-200 transition-all">
                              <SelectValue placeholder="Corte...">
                                {cortes.find(c => c._id === field.value)?.nombre}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {cortes.map(c => (
                                <SelectItem key={c._id} value={c._id}>{c.nombre} ({c.factorConsumoTela}m)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="h-8 text-xs w-full" 
                        {...register(`items.${index}.personalizacion`, { valueAsNumber: true })} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="h-8 text-xs w-full" 
                        {...register(`items.${index}.acabados`, { valueAsNumber: true })} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input 
                        type="number" 
                        className="h-8 text-xs w-full font-bold" 
                        {...register(`items.${index}.cantidad`, { valueAsNumber: true })} 
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {formatCurrency(itemCalculations[index]?.unit || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {formatCurrency(itemCalculations[index]?.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive opacity-50 hover:opacity-100"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 uppercase text-[10px] font-black border-t">
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-right text-slate-500">Total Detalle:</td>
                  <td className="px-4 py-4 text-right text-lg text-primary">{formatCurrency(grandTotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.items && <p className="text-xs text-destructive mt-2">{errors.items.message}</p>}
        </CardContent>
      </Card>

      <ClientFormModal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        onSuccess={(newClient) => {
          setClients(prev => [...prev, newClient].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial)));
          setValue("clientId", newClient._id!);
        }}
      />

      <BudgetPreviewDialog 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        budget={{
          description: watch("description"),
          observations: watch("observations"),
          fecha: new Date().toISOString(),
          clientId: selectedClient,
          estructuraCostosId: selectedEstructura,
          urgencia: watchedUrgencia,
          items: watchedItems.map((item, idx) => ({
            ...item,
            modeloId: modelos.find(m => m._id === item.modeloId),
            telaId: telas.find(t => t._id === item.telaId),
            corteId: cortes.find(c => c._id === item.corteId),
            precioUnitario: itemCalculations[idx]?.unit || 0,
            totalItem: itemCalculations[idx]?.total || 0
          })),
          totalCost: grandTotal,
          volumeDiscountAmount: volumeDiscountInfo.amount,
          volumeDiscountPercent: volumeDiscountInfo.percent
        }}
      />
    </form>
  );
};

export default BudgetForm;
