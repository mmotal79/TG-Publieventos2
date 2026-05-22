import mongoose from "mongoose";

export interface IContactRequest extends mongoose.Document {
  nombre: string;
  empresa?: string;
  telefono: string;
  email: string;
  mensaje: string;
  status: 'pendiente' | 'revisado' | 'contactado' | 'leido';
  createdAt: Date;
}

const ContactRequestSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  empresa: { type: String, trim: true },
  telefono: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor use un email válido']
  },
  mensaje: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pendiente', 'revisado', 'contactado', 'leido'], 
    default: 'pendiente' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Index for better query performance
ContactRequestSchema.index({ createdAt: -1 });
ContactRequestSchema.index({ status: 1 });

export const ContactRequestModel = mongoose.model<IContactRequest>("ContactRequest", ContactRequestSchema);
