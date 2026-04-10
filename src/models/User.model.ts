/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nombre: string;
  email: string;
  rol: number; // 0: Admin, 1: Gerente, 2: Vendedor, 3: Empleado, 4: Cliente
  estado: 'Activo' | 'Bloqueado' | 'Suspendido' | 'Baja Laboral';
  salarioBaseUSD?: number;
  porcentajeComision?: number;
  frecuenciaPago?: 'Semanal' | 'Quincenal' | 'Mensual';
  fechaRegistro: Date;
}

const UserSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido'] 
  },
  rol: { type: Number, required: true, enum: [0, 1, 2, 3, 4] },
  estado: { 
    type: String, 
    required: true, 
    enum: ['Activo', 'Bloqueado', 'Suspendido', 'Baja Laboral'], 
    default: 'Activo' 
  },
  salarioBaseUSD: { type: Number, default: 0 },
  porcentajeComision: { type: Number, default: 0 },
  frecuenciaPago: { type: String, enum: ['Semanal', 'Quincenal', 'Mensual'] },
  fechaRegistro: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
