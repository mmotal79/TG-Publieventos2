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
  const PORT = 3000;

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
  // 3. RUTAS DE LA API
  // ==========================================
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      env: process.env.NODE_ENV || 'development'
    });
  });

  // User Management
  app.use("/api/users", userRoutes);
  
  // Catalogs
  app.use("/api/catalogs", catalogRoutes);

  // Clients
  app.use("/api/clients", clientRoutes);

  // Global Configuration
  app.use("/api/config", configRoutes);

  // ==========================================
  // 4. API GUARD (Protección 404 para API)
  // ==========================================
  // Evita que rutas /api/* caigan accidentalmente en el catch-all de la SPA
  app.use("/api/*", (req, res) => {
    console.warn(`[404 API] Intento de acceso a ruta inexistente: ${req.originalUrl}`);
    res.status(404).json({ 
      message: `La ruta de API '${req.originalUrl}' no existe en este servidor.`,
      error: "API_ROUTE_NOT_FOUND"
    });
  });

  // ==========================================
  // 5. STATIC FILES / FRONTEND (SPA)
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    // Configuración para Desarrollo con Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Configuración para Producción (Render, etc.)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // El "Catch-all" para manejar el routing de React (Single Page Application)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor Express ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`📡 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
