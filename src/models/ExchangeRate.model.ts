import mongoose, { Schema } from 'mongoose';

const ExchangeRateSchema = new Schema({
  date: { type: Date, required: true },
  rate: { type: Number, required: true },
  source: { type: String, default: 'dolarapi' }
});

export const ExchangeRateModel = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', ExchangeRateSchema);
