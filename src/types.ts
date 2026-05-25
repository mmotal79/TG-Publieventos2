/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IImagenSeccion {
  _id?: string;
  sectionKey: string;     
  base64Data: string;     
  isVisible: boolean;     
  order: number;
  createdAt?: string;
}

export interface ISeccionConfig {
  key: string;            
  label: string;          
  carouselInterval: number;
}

export enum UserRole {
  ADMIN = 0,
  MANAGER = 1,
  SALES = 2,
  EMPLOYEE = 3,
  CLIENT = 4,
}

export interface UserProfile {
  _id?: string; // MongoDB user ID
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
  emailCorporativo?: string;
  urlInstagram?: string;
  urlFacebook?: string;
  urlTiktok?: string;
  nombreAsesor: string; // Dynamic advisor name
  informacionPago: string;
  logoBase64: string;
  mostrarConfiguradorLanding: boolean;
  showPortfolio: boolean;
  showCreations: boolean;
  showPayroll: boolean;
  updatedAt?: string;
}

export interface ISolicitudContacto {
  _id?: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  mensaje: string;
  leido: boolean;
  createdAt?: string;
}

export interface Client {
  _id?: string;
  celular: string; // Primary Key
  razonSocial: string;
  contacto: string;
  rif: string;
  email: string;
  direccion?: string;
  creado_por?: string; // Vendedor creator email
  creatorId?: string;
  creatorRole?: number;
  createdAt?: string;
}

export interface Tela {
  _id: string;
  nombre: string;
  composicion: string;
  gramaje: number;
  costoPorMetro: number;
  color: string;
  stockMetros: number;
  activo: boolean;
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
  status: 'pendiente' | 'aceptado_con_abono' | 'en_proceso' | 'culminado' | 'entregado_y_pagado' | 'anulado';
  disenoVectorialAprobado?: boolean;
  tallasValidadasConMuestra?: boolean;
  frozenVolumeData?: any;
  tasaBCV?: number;
  creatorEmail?: string;
  creatorRole?: number;
  creatorId?: string;
  creatorName?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface IVendedorItem {
  itemId: string; // ID of the item in the base budget's items array
  precioUnitario: number;
  totalItem: number;
}

export interface IPresupuestoVendedor {
  _id?: string;
  id_presupuesto_sistema: string;
  items_modificados: IVendedorItem[];
  subtotal_vendedor: number;
  monto_total_vendedor: number;
  creado_por: string;
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

export interface PortafolioItem {
  _id?: string;
  clienteId: string;
  nombreCliente: string;
  imagen: string;
  comentario?: string;
  activo: boolean;
  mostrarTestimonio: boolean;
  createdAt?: string;
}

export interface CreacionItem {
  _id?: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  precioBase: number;
  activo: boolean;
  createdAt?: string;
}

export interface IElementoFooter {
  _id?: string;
  nombreElemento: string;
  tituloTexto: string;
  cuerpoTexto: string;
  isVisible: boolean;
  order: number;
}

export type WorkerStatus = 'activo' | 'inactivo' | 'retirado';
export type PaymentFrequency = 'Semanal' | 'Quincenal' | 'Mensual';

export interface Worker {
  _id?: string;
  nombre: string;
  cedula: string;
  email: string;
  direccion: string;
  telefono: string;
  cargo: string;
  frecuenciaPago: PaymentFrequency;
  sueldoBase?: number;
  comision?: number;
  banco: string;
  codigoBIN: string;
  status: WorkerStatus;
  hasSystemAccess: boolean;
  systemRole?: number;
  userId?: string; // Reference to User if system access is true
  createdAt?: string;
}

export interface SystemUser {
  _id?: string;
  nombre: string;
  email: string;
  rol: number;
  estado: string;
  identificacion: string; // To match worker.cedula
  createdAt?: string;
}
