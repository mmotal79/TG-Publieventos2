/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

const PaymentSchema = new Schema({
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  method: { type: String, required: true },
  reference: { type: String },
  exchangeRate: { type: Number },
  date: { type: Date, default: Date.now },
  amountUSD: { type: Number, required: true },
});

const BudgetItemSchema = new Schema({
  modeloId: { type: Schema.Types.ObjectId, ref: 'Modelo', required: true },
  telaId: { type: Schema.Types.ObjectId, ref: 'Tela', required: true },
  corteId: { type: Schema.Types.ObjectId, ref: 'Corte', required: true },
  personalizacion: { type: Number, default: 0 },
  acabados: { type: Number, default: 0 },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  totalItem: { type: Number, required: true },
  productionStatus: {
    corte: { type: Number, default: 0 },
    costura: { type: Number, default: 0 },
    estampado: { type: Number, default: 0 },
    acabados: { type: Number, default: 0 },
    empaquetado: { type: Number, default: 0 },
    entrega: { type: Number, default: 0 }
  }
});

const BudgetSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  estructuraCostosId: { type: Schema.Types.ObjectId, ref: 'EstructuraCostos', required: true },
  urgencia: { type: String, enum: ['normal', 'urgente', 'planificada'], default: 'normal' },
  description: { type: String, required: true },
  observations: { type: String },
  items: [BudgetItemSchema],
  payments: [PaymentSchema],
  totalCost: { type: Number, required: true },
  volumeDiscountAmount: { type: Number, default: 0 },
  volumeDiscountPercent: { type: Number, default: 0 },
  status: { type: String, enum: ['pendiente', 'aceptado_con_abono', 'en_proceso', 'culminado', 'entregado_y_pagado', 'anulado'], default: 'pendiente' },
  disenoVectorialAprobado: { type: Boolean, default: false },
  tallasValidadasConMuestra: { type: Boolean, default: false },
  frozenVolumeData: { type: Schema.Types.Mixed },
  montoAbonado: { type: Number, default: 0 },
  creatorEmail: { type: String, required: true },
  creatorRole: { type: Number, required: true },
  creatorId: { type: String },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

export const BudgetModel = mongoose.model('Budget', BudgetSchema);

const BudgetItemVendedorSchema = new Schema({
  itemId: { type: String, required: true },
  precioUnitario: { type: Number, required: true },
  totalItem: { type: Number, required: true }
});

const BudgetVendedorSchema = new Schema({
  id_presupuesto_sistema: { type: Schema.Types.ObjectId, ref: 'Budget', required: true },
  items_modificados: [BudgetItemVendedorSchema],
  subtotal_vendedor: { type: Number, required: true },
  monto_total_vendedor: { type: Number, required: true },
  creado_por: { type: String, required: true } // Vendedor email or user identifier
}, { timestamps: true });

export const BudgetVendedorModel = mongoose.model('BudgetVendedor', BudgetVendedorSchema);
