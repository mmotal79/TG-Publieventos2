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
      .populate('items.modeloId')
      .populate('items.telaId')
      .populate('items.corteId')
      .populate('estructuraCostosId')
      .sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});

// Get individual budget
router.get("/:id", async (req, res) => {
  try {
    const budget = await BudgetModel.findById(req.params.id)
      .populate('clientId')
      .populate('items.modeloId')
      .populate('items.telaId')
      .populate('items.corteId')
      .populate('estructuraCostosId');
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el presupuesto" });
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

// Add payment to budget
router.post("/:id/payments", async (req, res) => {
  try {
    const budget = await BudgetModel.findById(req.params.id);
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
    
    const payment = req.body;
    budget.payments.push(payment);
    budget.montoAbonado += payment.amountUSD;
    
    await budget.save();
    await budget.populate('clientId');
    res.status(201).json(budget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al registrar pago", message: error.message });
  }
});

// Update a specific payment
router.put("/:id/payments/:paymentId", async (req, res) => {
  try {
    const budget: any = await BudgetModel.findById(req.params.id);
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });
    
    let payment;
    if (req.params.paymentId.startsWith('idx_')) {
      const idx = parseInt(req.params.paymentId.replace('idx_', ''), 10);
      payment = budget.payments[idx];
    } else {
      payment = budget.payments.id(req.params.paymentId);
    }
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });

    // Deduct old amount USD and add new amount USD
    budget.montoAbonado -= payment.amountUSD;
    
    payment.set(req.body);
    budget.montoAbonado += payment.amountUSD;

    await budget.save();
    await budget.populate('clientId');
    res.json(budget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al actualizar pago", message: error.message });
  }
});

// Delete a specific payment
router.delete("/:id/payments/:paymentId", async (req, res) => {
  try {
    const budget: any = await BudgetModel.findById(req.params.id);
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });

    let payment;
    if (req.params.paymentId.startsWith('idx_')) {
      const idx = parseInt(req.params.paymentId.replace('idx_', ''), 10);
      payment = budget.payments[idx];
    } else {
      payment = budget.payments.id(req.params.paymentId);
    }
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });

    budget.montoAbonado -= payment.amountUSD;
    if (req.params.paymentId.startsWith('idx_')) {
      budget.payments.splice(parseInt(req.params.paymentId.replace('idx_', ''), 10), 1);
    } else {
      budget.payments.pull({ _id: req.params.paymentId });
    }

    await budget.save();
    await budget.populate('clientId');
    res.json(budget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al eliminar pago", message: error.message });
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
