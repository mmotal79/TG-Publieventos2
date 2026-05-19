/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalConfig extends Document {
  nombreComercial: string;
  razonSocial: string;
  rif: string;
  telefonoCorporativo: string;
  informacionPago: string;
  logoBase64: string;
  mostrarConfiguradorLanding: boolean;
  updatedAt: Date;
}

const GlobalConfigSchema: Schema = new Schema({
  nombreComercial: { type: String, default: 'TG-Publieventos' },
  razonSocial: { type: String, default: '' },
  rif: { type: String, default: '' },
  telefonoCorporativo: { type: String, default: '' },
  informacionPago: { type: String, default: '' },
  logoBase64: { type: String, default: '' },
  mostrarConfiguradorLanding: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IGlobalConfig>('GlobalConfig', GlobalConfigSchema);
