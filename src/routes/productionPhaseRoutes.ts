import { Router } from "express";
import { ProductionPhaseModel } from "../models/ProductionPhase.model.js";

const router = Router();

// Get all phases
router.get("/", async (req, res) => {
  try {
    const phases = await ProductionPhaseModel.find().sort({ order: 1 });
    res.json(phases);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener fases de producción" });
  }
});

// Create/Update phases (batch)
router.post("/batch", async (req, res) => {
  try {
    const phases = req.body; // Array of phases
    for (const phase of phases) {
      if (phase._id) {
        await ProductionPhaseModel.findByIdAndUpdate(phase._id, phase);
      } else {
        await ProductionPhaseModel.create(phase);
      }
    }
    const updatedPhases = await ProductionPhaseModel.find().sort({ order: 1 });
    res.json(updatedPhases);
  } catch (error) {
    res.status(400).json({ error: "Error al actualizar fases" });
  }
});

// Individual CRUD if needed
router.post("/", async (req, res) => {
    try {
        const newPhase = await ProductionPhaseModel.create(req.body);
        res.status(201).json(newPhase);
    } catch (e) {
        res.status(400).json({ error: "Error al crear fase" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const phase = await ProductionPhaseModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(phase);
    } catch (e) {
        res.status(400).json({ error: "Error al actualizar fase" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await ProductionPhaseModel.findByIdAndDelete(req.params.id);
        res.json({ message: "Fase eliminada" });
    } catch (e) {
        res.status(500).json({ error: "Error al eliminar fase" });
    }
});

export default router;
