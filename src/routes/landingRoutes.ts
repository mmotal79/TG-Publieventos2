import { Router } from "express";
import { z } from "zod";
import { SectionImageModel } from "../models/SectionImage.model.js";
import { SectionConfigModel } from "../models/SectionConfig.model.js";
import { FooterElementModel } from "../models/FooterElement.model.js";
import { ContactRequestModel } from "../models/ContactRequest.model.js";

const router = Router();

// --- Contact Requests (Landing Page notifications) ---

const contactSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto").max(100).trim(),
  empresa: z.string().max(100).trim().default(''),
  telefono: z.string().min(7, "Teléfono inválido").max(20).trim(),
  email: z.string().email("Email inválido").trim().lowercase(),
  mensaje: z.string().min(10, "Mensaje muy corto").max(2000).trim(),
});

// Public endpoint to receive contact requests
router.post("/contact", async (req, res) => {
  try {
    // 1. Validation & Sanitization with Zod (Prevents Injection)
    const validatedData = contactSchema.parse(req.body);

    // 2. Persistence
    const newRequest = new ContactRequestModel(validatedData);
    await newRequest.save();

    console.log(`[Notification] Nueva solicitud de contacto recibida de ${validatedData.nombre}`);
    
    res.status(201).json({ 
      message: "Solicitud recibida correctamente",
      id: newRequest._id 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Datos inválidos", 
        details: error.issues.map(e => ({ path: e.path, message: e.message })) 
      });
    }
    console.error("Error saving contact request:", error);
    res.status(500).json({ error: "Error interno al procesar la solicitud" });
  }
});

// Admin/Notification: Get all contacts
router.get("/contact", async (req, res) => {
  try {
    console.log("[API] Obteniendo todas las solicitudes de contacto");
    const contacts = await ContactRequestModel.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mark contact as read (leido: true)
router.patch("/contact/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] Marcando solicitud como leída: ${id}`);
    const contact = await ContactRequestModel.findByIdAndUpdate(
      id, 
      { leido: true, status: 'leido' }, 
      { new: true }
    );
    if (!contact) {
      console.warn(`[NOT_FOUND] Solicitud no encontrada para marcar lectura: ${id}`);
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    res.json(contact);
  } catch (error: any) {
    console.error("Error marking contact as read:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete contact request
router.delete("/contact/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API_DELETE] Iniciando eliminación de solicitud: ${id}`);
    
    if (!id || id === 'undefined' || id === 'null') {
      console.warn("[API_DELETE] ID recibido no es válido");
      return res.status(400).json({ error: "El ID de la solicitud es requerido" });
    }

    // Validar formato de ObjectId de MongoDB
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.warn(`[API_DELETE] Formato de ID inválido: ${id}`);
      return res.status(400).json({ error: "El formato del ID no es válido" });
    }

    const contact = await ContactRequestModel.findByIdAndDelete(id);
    
    if (!contact) {
      console.warn(`[API_DELETE] No se encontró el documento con ID: ${id}`);
      return res.status(404).json({ error: "No se encontró la solicitud para eliminar" });
    }
    
    console.log(`[API_DELETE] Eliminación exitosa: ${id}`);
    return res.status(200).json({ 
      success: true,
      message: "La solicitud de contacto ha sido eliminada permanentemente.",
      deletedId: id
    });
  } catch (error: any) {
    console.error(`[API_DELETE_FATAL] Error al eliminar contacto ${req.params.id}:`, error);
    return res.status(500).json({ 
      error: "Error interno del servidor al procesar la eliminación",
      details: error.message 
    });
  }
});

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
