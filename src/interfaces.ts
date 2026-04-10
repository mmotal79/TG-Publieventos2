/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Interfaces de Catálogos para TG-Publieventos

export interface AcabadoEspecial {
  id: string;
  nombre: string;
  descripcion: string;
  costoUnitario: number; // USD
  activo: boolean;
}

export interface ConfiguracionGlobal {
  id: string;
  tasaCambioBS: number;
  porcentajeImpuesto: number;
  descuentoVolumen: {
    minCantidad: number;
    porcentajeDescuento: number;
  }[];
  recargosUrgencia: {
    nivel: string; // Normal, Prioridad, Urgente, Crítico
    multiplicador: number;
  }[];
}

export interface DisenoModelo {
  id: string;
  tipoPrenda: string; // Ej: Camisa, Pantalón, Chaqueta
  nivelComplejidad: 'Bajo' | 'Medio' | 'Alto';
  tiempoEstimadoMinutos: number;
  activo: boolean;
}

export interface PersonalizacionBordado {
  id: string;
  nombre: string;
  rangoPuntadasMin: number;
  rangoPuntadasMax: number;
  maxColores: number;
  costoBase: number; // USD
}

export interface PersonalizacionEstampado {
  id: string;
  tecnica: 'Serigrafía' | 'Sublimación' | 'Vinil';
  costoPorCm2: number; // USD
  costoFijoSetup?: number; // USD (Ej: Revelado de malla)
}

export interface Tela {
  id: string;
  nombre: string;
  composicion: string; // Ej: 100% Algodón, 50% Poliéster
  gramaje: number; // g/m2
  costoPorMetro: number; // USD
  color: string;
  stockMetros: number;
  activo: boolean;
}

export interface TipoCorte {
  id: string;
  nombre: string; // Ej: Corte Recto, Corte Princesa, Oversize
  factorConsumoTela: number; // Multiplicador, ej: 1.1 (10% más de tela)
  factorTiempoConfeccion: number; // Multiplicador de tiempo
}

export interface TransaccionAbono {
  id: string;
  budgetId: string;
  clientId: string;
  monto: number;
  moneda: 'USD' | 'BS' | 'CRYPTO';
  tasaAplicada: number; // Tasa de cambio al momento del pago
  montoEquivalenteUSD: number;
  metodoPago: 'Efectivo' | 'Transferencia' | 'Zelle' | 'Binance' | 'Punto de Venta';
  referencia?: string;
  fecha: string;
  registradoPor: string; // User ID
}
