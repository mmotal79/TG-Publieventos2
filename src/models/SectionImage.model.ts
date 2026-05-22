import mongoose, { Schema, Document } from "mongoose";
import { IImagenSeccion } from "../types.js";

const SectionImageSchema = new Schema({
  sectionKey: { type: String, required: true, index: true },
  base64Data: { type: String, required: true },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const SectionImageModel = mongoose.model<IImagenSeccion & Document>("SectionImage", SectionImageSchema);
