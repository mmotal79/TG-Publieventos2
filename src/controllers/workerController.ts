/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import Worker from '../models/Worker.model.js';
import User from '../models/User.model.js';

export const getWorkers = async (req: Request, res: Response) => {
  try {
    const workers = await Worker.find().populate('userId', 'rol estado');
    res.json(workers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createWorker = async (req: Request, res: Response) => {
  try {
    const workerData = req.body;
    let newUser = null;

    if (workerData.hasSystemAccess && workerData.systemRole !== undefined) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: workerData.email });
      if (existingUser) {
        throw new Error('Ya existe un usuario con este correo electrónico.');
      }

      newUser = new User({
        nombre: workerData.nombre,
        email: workerData.email,
        rol: workerData.systemRole,
        estado: workerData.status === 'activo' ? 'Activo' : 'Bloqueado',
        identificacion: workerData.cedula,
        salarioBaseUSD: workerData.sueldoBase || 0,
        porcentajeComision: workerData.comision || 0,
        frecuenciaPago: workerData.frecuenciaPago
      });
      await newUser.save();
      workerData.userId = newUser._id;
    }

    const worker = new Worker(workerData);
    await worker.save();
    res.status(201).json(worker);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workerData = req.body;
    
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    // Bidirectional sync: Worker -> User
    if (worker.userId) {
      const userStatusMap: Record<string, string> = {
        'activo': 'Activo',
        'inactivo': 'Bloqueado',
        'retirado': 'Suspendido'
      };
      
      const newStatus = userStatusMap[workerData.status] || 'Bloqueado';
      await User.findByIdAndUpdate(worker.userId, { 
        estado: newStatus as any,
        nombre: workerData.nombre,
        email: workerData.email,
        identificacion: workerData.cedula,
        salarioBaseUSD: workerData.sueldoBase,
        porcentajeComision: workerData.comision,
        frecuenciaPago: workerData.frecuenciaPago
      });
    } else if (workerData.hasSystemAccess && !worker.hasSystemAccess) {
        // Toggle system access ON
        const newUser = new User({
            nombre: workerData.nombre,
            email: workerData.email,
            rol: workerData.systemRole || 3,
            estado: workerData.status === 'activo' ? 'Activo' : 'Bloqueado',
            identificacion: workerData.cedula,
            salarioBaseUSD: workerData.sueldoBase || 0,
            porcentajeComision: workerData.comision || 0,
            frecuenciaPago: workerData.frecuenciaPago
          });
          await newUser.save();
          workerData.userId = newUser._id;
    }

    const updatedWorker = await Worker.findByIdAndUpdate(id, workerData, { new: true });
    res.json(updatedWorker);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWorker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    // Restriction: Cannot delete workers with Manager or Admin roles in the system
    // Also check if the worker's cargo implies high hierarchy
    const highHierarchyCargos = ['gerente', 'administrador', 'director', 'ceo'];
    const isHighHierarchyCargo = highHierarchyCargos.includes(worker.cargo.toLowerCase());
    
    // Check if associated user is Admin or Manager
    let isHighHierarchyUser = false;
    if (worker.userId) {
      const user = await User.findById(worker.userId);
      if (user && (user.rol === 0 || user.rol === 1)) {
        isHighHierarchyUser = true;
      }
    }

    if (isHighHierarchyCargo || isHighHierarchyUser) {
      return res.status(403).json({ error: 'La eliminación de personal con jerarquía de Gerencia o Administración está denegada.' });
    }

    // Step 1: Cleanup access (if they have a user, delete it first)
    if (worker.userId) {
      await User.findByIdAndDelete(worker.userId);
    } else {
      // Fallback check by identification/email
      await User.findOneAndDelete({ 
        $or: [
          { identificacion: worker.cedula },
          { email: worker.email }
        ]
      });
    }

    // Step 2: Delete worker from Payroll
    await Worker.findByIdAndDelete(id);

    res.json({ message: 'Trabajador y sus accesos al sistema eliminados correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
