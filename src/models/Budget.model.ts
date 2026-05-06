/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

const BudgetItemSchema = new Schema({
  modeloId: { type: Schema.Types.ObjectId, ref: 'Modelo', required: true },
  telaId: { type: Schema.Types.ObjectId, ref: 'Tela', required: true },
  corteId: { type: Schema.Types.ObjectId, ref: 'Corte', required: true },
  personalizacion: { type: Number, default: 0 },
  acabados: { type: Number, default: 0 },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  totalItem: { type: Number, required: true }
});

const BudgetSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  estructuraCostosId: { type: Schema.Types.ObjectId, ref: 'EstructuraCostos', required: true },
  urgencia: { type: String, enum: ['normal', 'urgente', 'planificada'], default: 'normal' },
  description: { type: String, required: true },
  observations: { type: String },
  items: [BudgetItemSchema],
  totalCost: { type: Number, required: true },
  volumeDiscountAmount: { type: Number, default: 0 },
  volumeDiscountPercent: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'in_production', 'completed', 'delivered', 'cancelled', 'rejected'], default: 'pending' },
  montoAbonado: { type: Number, default: 0 },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

export const BudgetModel = mongoose.model('Budget', BudgetSchema);
