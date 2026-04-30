/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import User from '../models/User.model.js';
import mongoose from 'mongoose';

export const initializeAdmin = async () => {
  try {
    // 1. Eliminar colección antigua si el usuario lo solicitó (Migración rápida)
    try {
      const collections = await mongoose.connection.db.listCollections({ name: 'presupuestos' }).toArray();
      if (collections.length > 0) {
        console.log('[DB-INIT] Eliminando colección obsoleta "presupuestos"...');
        await mongoose.connection.db.dropCollection('presupuestos');
      }
    } catch (e) {
      console.log('[DB-INIT] No se pudo limpiar colecciones antiguas:', e);
    }

    const adminEmail = 'mmotal@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`[DB-INIT] No se encontró administrador principal. Creando para: ${adminEmail}`);
      const newAdmin = new User({
        nombre: 'Administrador Principal',
        email: adminEmail,
        rol: 0, // Admin
        estado: 'Activo',
        fechaRegistro: new Date()
      });
      await newAdmin.save();
      console.log('[DB-INIT] Administrador principal creado exitosamente.');
    } else {
      console.log(`[DB-INIT] Confirmado: Usuario ${adminEmail} existe y está configurado.`);
    }
  } catch (error) {
    console.error('[DB-INIT] Error al inicializar administrador:', error);
  }
};
