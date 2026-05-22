import mongoose from "mongoose";

const footerElementSchema = new mongoose.Schema({
  nombreElemento: { type: String, required: true },
  tituloTexto: { type: String, required: true },
  cuerpoTexto: { type: String, required: true },
  isVisible: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const FooterElementModel = mongoose.model("FooterElement", footerElementSchema);
