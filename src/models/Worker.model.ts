/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
  nombre: string;
  cedula: string;
  email: string;
  direccion: string;
  telefono: string;
  cargo: string;
  frecuenciaPago: 'Semanal' | 'Quincenal' | 'Mensual';
  sueldoBase?: number;
  comision?: number;
  banco: string;
  codigoBIN: string;
  status: 'activo' | 'inactivo' | 'retirado';
  hasSystemAccess: boolean;
  systemRole?: number;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WorkerSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  cedula: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  cargo: { type: String, required: true },
  frecuenciaPago: { type: String, enum: ['Semanal', 'Quincenal', 'Mensual'], required: true },
  sueldoBase: { type: Number, default: 0 },
  comision: { type: Number, default: 0 },
  banco: { type: String, required: true },
  codigoBIN: { type: String, required: true, minlength: 4, maxlength: 4 },
  status: { type: String, enum: ['activo', 'inactivo', 'retirado'], default: 'activo' },
  hasSystemAccess: { type: Boolean, default: false },
  systemRole: { type: Number },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWorker>('Worker', WorkerSchema);
