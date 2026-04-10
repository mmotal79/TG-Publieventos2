/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 0,
  MANAGER = 1,
  SALES = 2,
  EMPLOYEE = 3,
  CLIENT = 4,
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  baseSalary?: number; // In USD
  commissionRate?: number; // 0 to 1
  paymentFrequency?: 'weekly' | 'biweekly' | 'monthly';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  assignedSalesId: string; // Role 2 UID
  createdAt: string;
}

export interface Budget {
  id: string;
  clientId: string;
  salesId: string;
  description: string;
  items: BudgetItem[];
  totalCost: number;
  urgencyMultiplier: number; // e.g., 1.0, 1.2, 1.5
  status: 'pending' | 'approved' | 'rejected' | 'in_production' | 'completed';
  createdAt: string;
}

export interface BudgetItem {
  id: string;
  tela: number;
  corte: number;
  modelo: number;
  complejidad: number;
  personalizacion: number;
  acabados: number;
  volumen: number;
}

export interface Payment {
  id: string;
  budgetId: string;
  amount: number;
  currency: 'USD' | 'BS' | 'CRYPTO';
  exchangeRate: number; // Rate to USD
  paymentDate: string;
  method: string;
}

export interface Order {
  id: string;
  budgetId: string;
  clientId: string;
  totalAmount: number; // In USD
  paidAmount: number; // In USD
  balance: number; // In USD (Calculated)
  status: string;
}
