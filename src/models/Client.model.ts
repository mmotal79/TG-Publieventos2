/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  celular: string; // Primary Key
  razonSocial: string;
  contacto: string;
  rif: string;
  email: string;
  direccion?: string;
  createdAt: Date;
}

const ClientSchema: Schema = new Schema({
  celular: { type: String, required: true, unique: true },
  razonSocial: { type: String, required: true },
  contacto: { type: String, required: true },
  rif: { 
    type: String, 
    required: true,
    match: [/^[JGVE]-[0-9]{8}-[0-9]$/, 'Por favor ingrese un RIF válido (J-00000000-0)']
  },
  email: { 
    type: String, 
    required: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  direccion: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IClient>('Client', ClientSchema);
