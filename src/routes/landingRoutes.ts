import { Router } from "express";
import { SectionImageModel } from "../models/SectionImage.model.js";
import { SectionConfigModel } from "../models/SectionConfig.model.js";
import { FooterElementModel } from "../models/FooterElement.model.js";

const router = Router();

// --- Footer Elements ---

// Get all active footer elements (public)
router.get("/footer-elements", async (req, res) => {
  try {
    const elements = await FooterElementModel.find({ isVisible: true }).sort({ order: 1 });
    res.json(elements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all footer elements
router.get("/admin/footer-elements", async (req, res) => {
  try {
    const elements = await FooterElementModel.find().sort({ order: 1 });
    res.json(elements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Footer Element
router.post("/footer-elements", async (req, res) => {
  try {
    const newElement = new FooterElementModel(req.body);
    await newElement.save();
    res.status(201).json(newElement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update Footer Element
router.patch("/footer-elements/:id", async (req, res) => {
  try {
    const element = await FooterElementModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!element) return res.status(404).json({ error: "Elemento no encontrado" });
    res.json(element);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Footer Element
router.delete("/footer-elements/:id", async (req, res) => {
  try {
    const element = await FooterElementModel.findByIdAndDelete(req.params.id);
    if (!element) return res.status(404).json({ error: "Elemento no encontrado" });
    res.json({ message: "Elemento eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Images ---
router.get("/images/:sectionKey", async (req, res) => {
  try {
    const images = await SectionImageModel.find({ 
      sectionKey: req.params.sectionKey,
      isVisible: true 
    }).sort({ order: 1 });
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all images (including invisible ones)
router.get("/admin/images", async (req, res) => {
  try {
    const images = await SectionImageModel.find().sort({ sectionKey: 1, order: 1 });
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload/Create Image
router.post("/images", async (req, res) => {
  try {
    const { sectionKey, base64Data, order } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "No se proporcionó data de imagen." });
    }

    // Validation: 1.5MB limit
    // Base64 length validation
    const stringLength = base64Data.length - (base64Data.indexOf(',') + 1);
    const sizeInBytes = (stringLength * 3) / 4;
    const maxSize = 1.5 * 1024 * 1024;

    if (sizeInBytes > maxSize) {
      return res.status(400).json({ 
        error: "La imagen excede el límite de 1.5 MB.",
        size: `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`
      });
    }

    const newImage = new SectionImageModel({
      sectionKey,
      base64Data,
      order: order || 0,
      isVisible: true
    });

    await newImage.save();
    res.status(201).json(newImage);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update Image (Visibility/Order)
router.patch("/images/:id", async (req, res) => {
  try {
    const image = await SectionImageModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!image) return res.status(404).json({ error: "Imagen no encontrada" });
    res.json(image);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Image
router.delete("/images/:id", async (req, res) => {
  try {
    const image = await SectionImageModel.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ error: "Imagen no encontrada" });
    res.json({ message: "Imagen eliminada correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Configs ---

router.get("/configs", async (req, res) => {
  try {
    const configs = await SectionConfigModel.find();
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/configs", async (req, res) => {
  try {
    const { key, label, carouselInterval } = req.body;
    const config = await SectionConfigModel.findOneAndUpdate(
      { key },
      { label, carouselInterval },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
