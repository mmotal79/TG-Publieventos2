/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import User from '../models/User.model.js';

export const initializeAdmin = async () => {
  try {
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
      console.log(`[DB-INIT] Administrador ${adminEmail} ya existe en el sistema.`);
    }
  } catch (error) {
    console.error('[DB-INIT] Error al inicializar administrador:', error);
  }
};
