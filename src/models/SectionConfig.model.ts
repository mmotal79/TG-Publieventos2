import mongoose, { Schema, Document } from "mongoose";
import { ISeccionConfig } from "../types.js";

const SectionConfigSchema = new Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  carouselInterval: { type: Number, default: 4000 }
});

export const SectionConfigModel = mongoose.model<ISeccionConfig & Document>("SectionConfig", SectionConfigSchema);
