/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Importación de Rutas
import userRoutes from "./src/routes/userRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";
import clientRoutes from "./src/routes/clientRoutes.js";
import configRoutes from "./src/routes/configRoutes.js";
import { initializeAdmin } from "./src/lib/dbInit.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // ==========================================
  // 1. MIDDLEWARES (Prioridad Alta)
  // ==========================================
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Permitir payloads de imagen
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware para API (Depuración en producción)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API LOG] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
  });

  // ==========================================
  // 2. CONEXIÓN A BASE DE DATOS
  // ==========================================
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mmotal:mmotal5379@cluster0.lcdpyvx.mongodb.net/uniformes_db?appName=Cluster0";
  
  try {
    console.log("[DB] Intentando conectar a MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log("[DB] Conexión establecida exitosamente.");
    
    // Inicialización de administrador por defecto
    await initializeAdmin();
    
  } catch (error) {
    console.error("[DB] Error crítico de conexión:", error);
  }

  // ==========================================
  // 3. RUTAS DE LA API (Prioridad Absoluta)
  // ==========================================
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Middleware de trazado (Opcional, para debug)
  app.use("/api", (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Montaje de Routers de Negocio
  app.use("/api/users", userRoutes);
  app.use("/api/catalogs", catalogRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/config", configRoutes);

  // --- API GUARD (Filtro de Seguridad) ---
  // Cualquier petición que empiece por /api/ y llegue aquí es un 404 real.
  // Evita que caiga en el catch-all del frontend.
  app.all("/api/*", (req, res) => {
    console.warn(`[404_API] Endpoint inexistente: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "Ruta de API no encontrada",
      message: `El recurso '${req.originalUrl}' no existe en el servidor.` 
    });
  });

  // ==========================================
  // 4. ARCHIVOS ESTÁTICOS Y SPA (Frontend)
  // ==========================================
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(process.cwd(), 'dist');
    
    // Servir assets estáticos
    app.use(express.static(distPath, { index: false }));
    
    // Catch-all para la SPA
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Configuración para Desarrollo con Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Servidor Express ejecutándose en el puerto ${PORT}`);
    console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
