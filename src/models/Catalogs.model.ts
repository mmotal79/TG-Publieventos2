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

export const TelaModel = mongoose.model('Tela', TelaSchema);
export const ModeloModel = mongoose.model('Modelo', ModeloSchema);
export const CorteModel = mongoose.model('Corte', CorteSchema);
export const BordadoModel = mongoose.model('Bordado', BordadoSchema);
export const EstampadoModel = mongoose.model('Estampado', EstampadoSchema);
export const AcabadoModel = mongoose.model('Acabado', AcabadoSchema);
export const ConfiguracionModel = mongoose.model('Configuracion', ConfiguracionSchema);
