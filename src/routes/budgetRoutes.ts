/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import mongoose from "mongoose";
import { BudgetModel, BudgetVendedorModel } from "../models/Budget.model.js";

const router = Router();

// List all budgets
router.get("/", async (req, res) => {
  try {
    const { creatorEmail, role, deleted } = req.query;
    let filter: any = {};
    if (deleted === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }
    if (role === '2' && creatorEmail) {
      filter.$or = [
        { creatorEmail },
        { creatorEmail: { $exists: false } },
        { creatorEmail: null },
        { creatorEmail: '' }
      ];
    } else if (role === '1') {
      filter.creatorRole = { $ne: 0 };
    }
    const budgets = await BudgetModel.find(filter)
      .populate('clientId')
      .populate('items.modeloId')
      .populate('items.telaId')
      .populate('items.corteId')
      .populate('estructuraCostosId')
      .sort({ createdAt: -1 })
      .lean();
      
    // Populate missing creatorNames based on user names
    const User = mongoose.model('User');
    const allUsers: any[] = await User.find({}, 'email nombre');
    const userMap = new Map();
    allUsers.forEach(u => userMap.set(u.email.toLowerCase(), u.nombre));

    const enrichedBudgets = budgets.map((b: any) => {
      const email = b.creatorEmail ? b.creatorEmail.toLowerCase() : '';
      if (!b.creatorName || (b.creatorName === b.creatorEmail) || b.creatorName.includes('@')) {
        b.creatorName = userMap.get(email) || b.creatorName;
      }
      return b;
    });

    res.json(enrichedBudgets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});

// Get individual budget
router.get("/:id", async (req, res) => {
  try {
    const budget: any = await BudgetModel.findById(req.params.id)
      .populate('clientId')
      .populate('items.modeloId')
      .populate('items.telaId')
      .populate('items.corteId')
      .populate('estructuraCostosId')
      .lean();
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });

    // Populate missing creatorName
    const email = budget.creatorEmail ? budget.creatorEmail.toLowerCase() : '';
    if (!budget.creatorName || (budget.creatorName === budget.creatorEmail) || budget.creatorName.includes('@')) {
      const User = mongoose.model('User');
      const user: any = await User.findOne({ email });
      if (user) {
        budget.creatorName = user.nombre;
      }
    }

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

// Update budget status with transition logic
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, montoAbonado, disenoVectorialAprobado, tallasValidadasConMuestra } = req.body;
    const budget = await BudgetModel.findById(req.params.id).populate('clientId');
    if (!budget) return res.status(404).json({ error: "Presupuesto no encontrado" });

    const oldStatus = budget.status;
    const newStatus = status;

    // Side Effects:
    // 1. 'anulado' -> Deactivate client access if applicable
    if (newStatus === 'anulado') {
      const User = mongoose.model('User');
      await User.findOneAndUpdate(
        { email: (budget.clientId as any)?.email },
        { estado: 'Suspendido' }
      );
    }

    // 2. 'aceptado_con_abono' -> Freeze data
    if (newStatus === 'aceptado_con_abono') {
      // Logic for freezing: capture current state of items and factors
      budget.frozenVolumeData = {
        items: budget.items,
        totalCost: budget.totalCost,
        capturedAt: new Date()
      };
    }

    // Update budget
    budget.status = newStatus;
    if (montoAbonado !== undefined) {
      budget.montoAbonado = montoAbonado;
    }
    if (disenoVectorialAprobado !== undefined) {
      budget.disenoVectorialAprobado = disenoVectorialAprobado;
    }
    if (tallasValidadasConMuestra !== undefined) {
      budget.tallasValidadasConMuestra = tallasValidadasConMuestra;
    }

    await budget.save();
    res.json(budget);
  } catch (error: any) {
    res.status(400).json({ error: "Error al actualizar estatus", message: error.message });
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

// Delete budget (soft delete or hard delete)
router.delete("/:id", async (req, res) => {
  try {
    const { force } = req.query;
    if (force === 'true') {
      await BudgetModel.findByIdAndDelete(req.params.id);
      // Also delete any associated mirror budget
      await BudgetVendedorModel.deleteMany({ id_presupuesto_sistema: req.params.id });
    } else {
      await BudgetModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
    }
    res.json({ message: "Presupuesto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar presupuesto" });
  }
});

// Save or update vendedor budget mirror
router.post("/vendedor", async (req, res) => {
  try {
    const { id_presupuesto_sistema, items_modificados, subtotal_vendedor, monto_total_vendedor, creado_por } = req.body;
    
    let existing = await BudgetVendedorModel.findOne({ id_presupuesto_sistema });
    if (existing) {
      existing.items_modificados = items_modificados;
      existing.subtotal_vendedor = subtotal_vendedor;
      existing.monto_total_vendedor = monto_total_vendedor;
      existing.creado_por = creado_por;
      await existing.save();
      return res.status(200).json(existing);
    } else {
      const newMirror = new BudgetVendedorModel({
        id_presupuesto_sistema,
        items_modificados,
        subtotal_vendedor,
        monto_total_vendedor,
        creado_por
      });
      await newMirror.save();
      return res.status(201).json(newMirror);
    }
  } catch (error: any) {
    res.status(400).json({ error: "Error al registrar presupuesto de vendedor", message: error.message });
  }
});

// Get seller mirror by budget ID
router.get("/vendedor/:id_sistema", async (req, res) => {
  try {
    const mirror = await BudgetVendedorModel.findOne({ id_presupuesto_sistema: req.params.id_sistema });
    res.json(mirror || null);
  } catch (error: any) {
    res.status(500).json({ error: "Error al buscar espejo de vendedor", message: error.message });
  }
});

export default router;
