import mongoose, { Schema } from 'mongoose';

const ProductionPhaseSchema = new Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true }, // e.g. 'corte', 'costura'
  weight: { type: Number, required: true }, // e.g. 0.15
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
});

export const ProductionPhaseModel = mongoose.model('ProductionPhase', ProductionPhaseSchema);
