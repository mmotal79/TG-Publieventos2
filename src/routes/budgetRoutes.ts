/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { BudgetModel } from "../models/Budget.model.js";

const router = Router();

// List all budgets
router.get("/", async (req, res) => {
  try {
    const budgets = await BudgetModel.find()
      .populate('clientId')
      .sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});

// Create new budget
router.post("/", async (req, res) => {
  try {
    const newBudget = new BudgetModel(req.body);
    await newBudget.save();
    res.status(201).json(newBudget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al crear presupuesto", message: error.message });
  }
});

// Update budget
router.put("/:id", async (req, res) => {
  try {
    const updatedBudget = await BudgetModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBudget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al actualizar presupuesto", message: error.message });
  }
});

// Delete budget
router.delete("/:id", async (req, res) => {
  try {
    await BudgetModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Presupuesto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar presupuesto" });
  }
});

export default router;
