/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateBudgetTotal, formatCurrency } from '@/services/budgetService';

const budgetItemSchema = z.object({
  tela: z.number().min(0),
  corte: z.number().min(0),
  modelo: z.number().min(0),
  complejidad: z.number().min(0),
  personalizacion: z.number().min(0),
  acabados: z.number().min(0),
  volumen: z.number().min(1),
});

const budgetSchema = z.object({
  clientId: z.string().min(1, "Seleccione un cliente"),
  description: z.string().min(1, "Ingrese una descripción"),
  urgencyMultiplier: z.string(),
  items: z.array(budgetItemSchema).min(1, "Agregue al menos un item"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

const BudgetForm: React.FC = () => {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      urgencyMultiplier: "1.0",
      items: [{ tela: 0, corte: 0, modelo: 0, complejidad: 0, personalizacion: 0, acabados: 0, volumen: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const watchedUrgency = watch("urgencyMultiplier");

  const total = React.useMemo(() => {
    return calculateBudgetTotal(watchedItems as any, parseFloat(watchedUrgency));
  }, [watchedItems, watchedUrgency]);

  const onSubmit = (data: BudgetFormValues) => {
    console.log("Budget Data:", { ...data, totalCost: total });
    // TODO: Save to Firebase
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Cliente</Label>
          <Select onValueChange={(v: string) => setValue("clientId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client1">Cliente VIP S.A.</SelectItem>
              <SelectItem value="client2">Distribuidora Textil</SelectItem>
            </SelectContent>
          </Select>
          {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgencyMultiplier">Urgencia</Label>
          <Select defaultValue="1.0" onValueChange={(v) => setValue("urgencyMultiplier", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Nivel de Urgencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1.0">Normal (1.0x)</SelectItem>
              <SelectItem value="1.2">Prioridad (1.2x)</SelectItem>
              <SelectItem value="1.5">Urgente (1.5x)</SelectItem>
              <SelectItem value="2.0">Crítico (2.0x)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción del Pedido</Label>
        <Input {...register("description")} placeholder="Ej: 500 Uniformes para Personal de Planta" />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Items del Presupuesto</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ tela: 0, corte: 0, modelo: 0, complejidad: 0, personalizacion: 0, acabados: 0, volumen: 1 })}>
            <Plus className="w-4 w-4 mr-2" /> Agregar Item
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="relative">
            <CardContent className="pt-6">
              {fields.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tela ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.tela`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Corte ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.corte`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modelo ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.modelo`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Complej. ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.complejidad`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pers. ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.personalizacion`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acabados ($)</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.acabados`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Volumen</Label>
                  <Input type="number" {...register(`items.${index}.volumen`, { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 text-white">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wider font-bold">Total Presupuestado</p>
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full md:w-auto">
            Generar Presupuesto
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default BudgetForm;
