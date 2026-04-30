/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose, { Schema } from 'mongoose';

const SecurityLogSchema = new Schema({
  email: { type: String, required: true },
  attemptDate: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
  deviceType: { type: String }, // Mobile, Desktop, Tablet
  browser: { type: String },
  os: { type: String },
  timezone: { type: String },
  resolution: { type: String },
  language: { type: String },
  status: { type: String, default: 'blocked' } // blocked, warning, etc.
}, { timestamps: true });

export const SecurityLogModel = mongoose.model('SecurityLog', SecurityLogSchema);
