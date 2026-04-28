/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

const TelaSchema = new Schema({
  nombre: { type: String, required: true },
  composicion: { type: String, required: true },
  gramaje: { type: Number, required: true },
  costoPorMetro: { type: Number, required: true },
  color: { type: String, required: true },
  stockMetros: { type: Number, required: true },
  activo: { type: Boolean, default: true }
});

const ModeloSchema = new Schema({
  tipoPrenda: { type: String, required: true },
  nivelComplejidad: { type: String, enum: ['Bajo', 'Medio', 'Alto'], required: true },
  costoBase: { type: Number, default: 0 },
  factorComplejidad: { type: Number, default: 1.0 }, // Multiplier, e.g. 1.2 for 20% extra
  tiempoEstimadoMinutos: { type: Number, required: true },
  activo: { type: Boolean, default: true }
});

const CorteSchema = new Schema({
  nombre: { type: String, required: true },
  factorConsumoTela: { type: Number, required: true },
  factorTiempoConfeccion: { type: Number, required: true }
});

const BordadoSchema = new Schema({
  nombre: { type: String, required: true },
  rangoPuntadasMin: { type: Number, required: true },
  rangoPuntadasMax: { type: Number, required: true },
  maxColores: { type: Number, required: true },
  costoBase: { type: Number, required: true }
});

const EstampadoSchema = new Schema({
  tecnica: { type: String, enum: ['Serigrafía', 'Sublimación', 'Vinil'], required: true },
  costoPorCm2: { type: Number, required: true },
  costoFijoSetup: { type: Number, default: 0 }
});

const AcabadoSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  costoUnitario: { type: Number, required: true },
  activo: { type: Boolean, default: true }
});

const ConfiguracionSchema = new Schema({
  tasaCambioBS: { type: Number, required: true },
  porcentajeImpuesto: { type: Number, required: true },
  descuentoVolumen: [{ minCantidad: Number, porcentajeDescuento: Number }],
  recargosUrgencia: [{ nivel: String, multiplicador: Number }]
});

const EstructuraCostosSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  margenGanancia: { type: Number, required: true }, // e.g. 25
  porcentajeComision: { type: Number, default: 0 },
  iva: { type: Number, default: 16 },
  ajusteComplejidadBajo: { type: Number, default: 0 },
  ajusteComplejidadMedio: { type: Number, default: 5 },
  ajusteComplejidadAlto: { type: Number, default: 10 },
  costosAdicionales: [{
    nombre: { type: String, required: true },
    monto: { type: Number, required: true },
    tipo: { type: String, enum: ['Unitario', 'Distribuido'], required: true },
    activo: { type: Boolean, default: true }
  }],
  factoresVolumen: [{
    minUnidades: { type: Number, required: true },
    hastaUnidades: { type: Number, required: true },
    multiplicador: { type: Number, required: true }
  }],
  recargosUrgencia: {
    normal: { type: Number, default: 0 },
    urgente: { type: Number, default: 10 },
    planificada: { type: Number, default: -5 }
  },
  imagenReferencial: { type: String },
  activo: { type: Boolean, default: true }
});

export const TelaModel = mongoose.model('Tela', TelaSchema);
export const ModeloModel = mongoose.model('Modelo', ModeloSchema);
export const CorteModel = mongoose.model('Corte', CorteSchema);
export const BordadoModel = mongoose.model('Bordado', BordadoSchema);
export const EstampadoModel = mongoose.model('Estampado', EstampadoSchema);
export const AcabadoModel = mongoose.model('Acabado', AcabadoSchema);
export const ConfiguracionModel = mongoose.model('Configuracion', ConfiguracionSchema);
export const EstructuraCostosModel = mongoose.model('EstructuraCostos', EstructuraCostosSchema);
