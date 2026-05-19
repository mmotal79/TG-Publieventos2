/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Modelo, Tela, Corte, EstructuraCostos } from "@/types";

// budgetService.ts contains shared utility functions for budget management

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'VES' ? 'Bs' : currency === 'EUR' ? '€' : '$';
  return `${symbol} ${formatter.format(amount)}`;
};

/**
 * Unified calculation logic for budgets
 */
export const calculateBudgetPrice = (
  modelo: Modelo,
  tela: Tela,
  corte: Corte,
  estructura: EstructuraCostos,
  cantidad: number,
  params?: {
    personalizacion?: number;
    acabados?: number;
    urgencia?: 'normal' | 'urgente' | 'planificada';
    incluirIVA?: boolean;
  }
) => {
  if (!modelo || !tela || !corte || !estructura) return { unitPrice: 0, total: 0 };

  const qty = Math.max(1, cantidad);
  const { personalizacion = 0, acabados = 0, urgencia = 'normal', incluirIVA = false } = params || {};

  // 1. Base Cost
  const materialCost = (tela.costoPorMetro || 0) * (corte.factorConsumoTela || 1);
  const laborCost = (modelo.costoBase || 10) * (modelo.factorComplejidad || 1);
  
  // 2. Complexity Adjustment (if applicable)
  let complexityAjust = 0;
  if (modelo.nivelComplejidad === 'Bajo') complexityAjust = estructura.ajusteComplejidadBajo || 0;
  else if (modelo.nivelComplejidad === 'Medio') complexityAjust = estructura.ajusteComplejidadMedio || 5;
  else if (modelo.nivelComplejidad === 'Alto') complexityAjust = estructura.ajusteComplejidadAlto || 10;
  
  const baseSubtotal = (materialCost + laborCost + personalizacion + acabados) * (1 + complexityAjust / 100);
  
  // 3. Additional Costs from Structure
  const adicTotal = (estructura.costosAdicionales || [])
    .filter((a: any) => a.activo)
    .reduce((sum: number, a: any) => sum + (a.tipo === 'Unitario' ? (a.monto || 0) : (a.monto || 0) / qty), 0);

  const costBeforeMargin = baseSubtotal + adicTotal;

  // 4. Urgency Factor
  const recargos = estructura.recargosUrgencia || { normal: 0, urgente: 0, planificada: 0 };
  const recargoUrgent = urgencia === 'urgente' ? (recargos.urgente || 0) : 
                       urgencia === 'planificada' ? (recargos.planificada || 0) : 
                       (recargos.normal || 0);
  const urgencyMultiplier = 1 + (recargoUrgent / 100);

  // 5. Volume Factor
  let volumeFact = 1.0;
  if (estructura.factoresVolumen && estructura.factoresVolumen.length > 0) {
    const match = estructura.factoresVolumen.find((f: any) => qty >= f.minUnidades && qty <= f.hastaUnidades);
    if (match) volumeFact = match.multiplicador;
  }

  // 6. Final Calculation with Margin
  const unitPrice = costBeforeMargin * urgencyMultiplier * volumeFact * (1 + (estructura.margenGanancia || 25) / 100);
  
  // 7. Apply IVA if requested
  const totalNeto = unitPrice * qty;
  const total = incluirIVA ? totalNeto * (1 + (estructura.iva || 16) / 100) : totalNeto;

  return {
    unitWithMargin: unitPrice,
    totalPrice: total,
    ivaAmount: total * (estructura.iva || 16) / 100,
  };
};
