/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { SecurityLogModel } from "../models/SecurityLog.model.js";

const router = Router();

// List all security logs
router.get("/", async (req, res) => {
  try {
    const logs = await SecurityLogModel.find().sort({ attemptDate: -1 }).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener registros de seguridad" });
  }
});

// Create new security log
router.post("/", async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const logData = {
      ...req.body,
      ip: typeof ip === 'string' ? ip : Array.isArray(ip) ? ip[0] : 'unknown'
    };
    const newLog = new SecurityLogModel(logData);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error: any) {
    res.status(400).json({ error: "Error al registrar evento de seguridad", message: error.message });
  }
});

// Statistics endpoint (simplified)
router.get("/stats", async (req, res) => {
  try {
    const total = await SecurityLogModel.countDocuments();
    const byDevice = await SecurityLogModel.aggregate([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);
    const byEmail = await SecurityLogModel.aggregate([
       { $group: { _id: "$email", count: { $sum: 1 } } },
       { $sort: { count: -1 } },
       { $limit: 10 }
    ]);

    res.json({ total, byDevice, byEmail });
  } catch (error) {
    res.status(500).json({ error: "Error al calcular estadísticas" });
  }
});

// Delete a security log
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SecurityLogModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
    res.json({ message: "Registro eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el registro de seguridad" });
  }
});

export default router;
