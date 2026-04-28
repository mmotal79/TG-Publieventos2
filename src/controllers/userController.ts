/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import User, { IUser } from '../models/User.model.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ fechaRegistro: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    console.log(`[API] Buscando usuario por email: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[API] Usuario no encontrado: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`[API] Usuario encontrado: ${email}, Estado: ${user.estado}`);
    res.json(user);
  } catch (error) {
    console.error(`[API] Error al buscar usuario ${email}:`, error);
    res.status(500).json({ message: 'Error fetching user by email', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const userData: Partial<IUser> = req.body;
    
    // TODO: Integrate with Firebase Admin SDK to create auth user
    // const firebaseUser = await admin.auth().createUser({ email: userData.email, password: 'defaultPassword123' });
    
    const newUser = new User(userData);
    await newUser.save();
    
    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'El email ya está registrado' });
    } else {
      res.status(400).json({ message: 'Error creating user', error: error.message });
    }
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<IUser> = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // TODO: If status is 'Bloqueado', use Firebase Admin SDK to revoke refresh tokens
    // if (updates.estado === 'Bloqueado') {
    //   await admin.auth().revokeRefreshTokens(firebaseUid);
    // }

    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
};

export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    // This is a simplified payroll calculation endpoint
    const users = await User.find({ rol: { $in: [1, 2, 3] }, estado: 'Activo' });
    
    const payroll = users.map(user => {
      const base = user.salarioBaseUSD || 0;
      // In a real app, commissions would be calculated based on sales/production records
      const estimatedCommissions = user.porcentajeComision ? (user.porcentajeComision * 1000) : 0; // Mock calculation
      
      return {
        userId: user._id,
        nombre: user.nombre,
        rol: user.rol,
        frecuencia: user.frecuenciaPago,
        salarioBase: base,
        comisionesEstimadas: estimatedCommissions,
        totalEstimado: base + estimatedCommissions
      };
    });

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating payroll', error });
  }
};
