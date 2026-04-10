/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetItem, Budget } from '../types';

/**
 * Calculates the total cost of a budget based on the technical formula:
 * (((Tela * Corte) + (Modelo * Complejidad) + Personalización + Acabados) * Volumen) * Urgencia
 */
export const calculateBudgetTotal = (items: BudgetItem[], urgencyMultiplier: number): number => {
  const itemsTotal = items.reduce((acc, item) => {
    const base = (item.tela * item.corte) + (item.modelo * item.complejidad) + item.personalizacion + item.acabados;
    return acc + (base * item.volumen);
  }, 0);

  return itemsTotal * urgencyMultiplier;
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
