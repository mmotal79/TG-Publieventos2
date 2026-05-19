/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { BudgetModel } from "../models/Budget.model.js";
import ClientModel from "../models/Client.model.js";
import { ProductionPhaseModel } from "../models/ProductionPhase.model.js";
import mongoose from "mongoose";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastSixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // 1. Stats Calculation
    const [
      monthlySales,
      monthlyCollection,
      newClients,
      pendingOrders,
      completedOrders,
      salesChartData,
      productionStats,
      payrollData
    ] = await Promise.all([
      // Actual Month Sales (Approved budgets)
      BudgetModel.aggregate([
        { $match: { 
          status: { $in: ['approved', 'in_production', 'completed', 'delivered'] },
          fecha: { $gte: startOfMonth }
        }},
        { $group: { _id: null, total: { $sum: "$totalCost" } } }
      ]),

      // Actual Month Collection (Abonos)
      BudgetModel.aggregate([
        { $unwind: "$payments" },
        { $match: { "payments.date": { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$payments.amountUSD" } } }
      ]),

      // New Clients this month
      ClientModel.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Pending Orders
      BudgetModel.countDocuments({ status: { $in: ['pending', 'approved', 'in_production'] } }),

      // Completed Orders
      BudgetModel.countDocuments({ status: { $in: ['completed', 'delivered'] } }),

      // Sales Chart Data (Last 6 months)
      BudgetModel.aggregate([
        { $match: { 
          status: { $in: ['approved', 'in_production', 'completed', 'delivered'] },
          fecha: { $gte: lastSixMonths }
        }},
        { $group: {
          _id: { 
            year: { $year: "$fecha" }, 
            month: { $month: "$fecha" } 
          },
          total: { $sum: "$totalCost" }
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),

      // Average Production Progress as Percentage (2-step: Project Ratio -> Global Average)
      BudgetModel.aggregate([
        { $match: { status: { $in: ['approved', 'in_production'] } } },
        { $project: {
          totalBudgetQty: { $sum: "$items.cantidad" },
          corteSum: { $sum: "$items.productionStatus.corte" },
          costuraSum: { $sum: "$items.productionStatus.costura" },
          estampadoSum: { $sum: "$items.productionStatus.estampado" },
          acabadosSum: { $sum: "$items.productionStatus.acabados" },
          empaquetadoSum: { $sum: "$items.productionStatus.empaquetado" },
          entregaSum: { $sum: "$items.productionStatus.entrega" }
        }},
        { $project: {
          corte: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$corteSum", "$totalBudgetQty"] }] },
          costura: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$costuraSum", "$totalBudgetQty"] }] },
          estampado: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$estampadoSum", "$totalBudgetQty"] }] },
          acabados: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$acabadosSum", "$totalBudgetQty"] }] },
          empaquetado: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$empaquetadoSum", "$totalBudgetQty"] }] },
          entrega: { $cond: [{ $eq: ["$totalBudgetQty", 0] }, 0, { $divide: ["$entregaSum", "$totalBudgetQty"] }] }
        }},
        { $group: {
          _id: null,
          corte: { $avg: "$corte" },
          costura: { $avg: "$costura" },
          estampado: { $avg: "$estampado" },
          acabados: { $avg: "$acabados" },
          empaquetado: { $avg: "$empaquetado" },
          entrega: { $avg: "$entrega" }
        }},
        { $project: {
          corte: { $multiply: ["$corte", 100] },
          costura: { $multiply: ["$costura", 100] },
          estampado: { $multiply: ["$estampado", 100] },
          acabados: { $multiply: ["$acabados", 100] },
          empaquetado: { $multiply: ["$empaquetado", 100] },
          entrega: { $multiply: ["$entrega", 100] }
        }}
      ]),

      // Total Payroll Burden (Active employees)
      mongoose.model('User').aggregate([
        { $match: { estado: 'Activo', rol: { $in: [0, 1, 2, 3] } } },
        { $group: { _id: null, total: { $sum: "$salarioBaseUSD" } } }
      ])
    ]);

    // Format stats for frontend
    const stats = [
      { 
        title: 'Ventas del Mes', 
        value: `$${(monthlySales[0]?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
        icon: 'TrendingUp', 
        color: 'text-blue-600' 
      },
      { 
        title: 'Recaudación Mes', 
        value: `$${(monthlyCollection[0]?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
        icon: 'DollarSign', 
        color: 'text-green-600' 
      },
      { 
        title: 'Carga Nómina', 
        value: `$${(payrollData[0]?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
        icon: 'Wallet', 
        color: 'text-rose-600' 
      },
      { 
        title: 'Pedidos en Curso', 
        value: pendingOrders.toString(), 
        icon: 'Clock', 
        color: 'text-amber-600' 
      },
    ];

    // Format chart data
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const formattedChartData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const match = salesChartData.find(s => s._id.month === m && s._id.year === y);
      return {
        name: monthNames[m - 1],
        ventas: match ? match.total : 0
      };
    });

    // Format production stats
    const phases = await ProductionPhaseModel.find().sort({ order: 1 });
    const hasActiveProduction = productionStats.length > 0;
    const statsData = productionStats[0] || {};
    
    const formattedProduction = hasActiveProduction 
      ? phases.map(phase => {
          // Handle potential key mismatch if some records use 'empaquetac' instead of 'empaquetado'
          const avgValue = statsData[phase.key] || (phase.key === 'empaquetado' ? statsData['empaquetac'] : 0) || 0;
          return {
            name: phase.name,
            progress: Math.round(avgValue)
          };
        })
      : [];

    res.json({
      stats,
      chartData: formattedChartData,
      production: formattedProduction,
      newClientsThisMonth: newClients
    });

  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
