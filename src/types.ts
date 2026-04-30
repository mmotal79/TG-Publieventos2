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

export interface GlobalConfig {
  _id?: string;
  nombreComercial: string;
  razonSocial: string;
  rif: string;
  telefonoCorporativo: string;
  nombreAsesor: string; // Dynamic advisor name
  informacionPago: string;
  logoBase64: string;
  updatedAt?: string;
}

export interface Client {
  _id?: string;
  celular: string; // Primary Key
  razonSocial: string;
  contacto: string;
  rif: string;
  email: string;
  direccion?: string;
  createdAt?: string;
}

export interface Tela {
  _id: string;
  nombre: string;
  costoPorMetro: number;
}

export interface Modelo {
  _id: string;
  tipoPrenda: string;
  nivelComplejidad: 'Bajo' | 'Medio' | 'Alto';
  costoBase: number;
  factorComplejidad: number;
}

export interface Corte {
  _id: string;
  nombre: string;
  factorConsumoTela: number;
}

export interface BudgetItem {
  id: string;
  modeloId: string;
  telaId: string;
  corteId: string;
  personalizacion: number; // Sum of extra costs
  acabados: number; // Sum of extra costs
  cantidad: number;
  precioUnitario: number; // Calculated
  totalItem: number; // Calculated
}

export interface Budget {
  _id?: string;
  clientId: string;
  estructuraCostosId: string;
  urgencia: 'normal' | 'urgente' | 'planificada';
  description: string;
  items: BudgetItem[];
  totalCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_production' | 'completed';
  createdAt?: string;
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

export interface CostoAdicional {
  id?: string;
  nombre: string;
  monto: number;
  tipo: 'Unitario' | 'Distribuido';
  activo: boolean;
}

export interface FactorVolumen {
  minUnidades: number;
  hastaUnidades: number;
  multiplicador: number;
}

export interface RecargosUrgencia {
  normal: number;
  urgente: number;
  planificada: number;
}

export interface EstructuraCostos {
  _id?: string;
  nombre: string;
  descripcion: string;
  margenGanancia: number;
  porcentajeComision: number;
  iva: number;
  ajusteComplejidadBajo: number;
  ajusteComplejidadMedio: number;
  ajusteComplejidadAlto: number;
  costosAdicionales: CostoAdicional[];
  factoresVolumen: FactorVolumen[];
  recargosUrgencia: RecargosUrgencia;
  imagenReferencial?: string;
  activo: boolean;
}
