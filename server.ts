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
  
  // Create an API Router to encapsulate all backend logic
  const apiRouter = express.Router();

  // Middleware para forzar JSON y Logging de Rutas en la API
  apiRouter.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[API_TRACE] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });

  apiRouter.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      node_env: process.env.NODE_ENV
    });
  });

  // Montaje de Routers en el apiRouter (sin el prefijo /api aquí, se añade al montar el router en app)
  apiRouter.use("/users", userRoutes);
  apiRouter.use("/catalogs", catalogRoutes);
  apiRouter.use("/clients", clientRoutes);
  apiRouter.use("/config", configRoutes);

  // API 404 - Si llega aquí dentro de apiRouter, definitivamente no existe el endpoint
  apiRouter.all("*", (req, res) => {
    console.warn(`[404_API] Endpoint no encontrado: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "ENDPOINT_NOT_FOUND",
      message: `La ruta de API '${req.originalUrl}' no existe o el método ${req.method} es incorrecto.`,
      path: req.originalUrl
    });
  });

  // Montar el Router de API completo en el prefijo /api
  app.use("/api", apiRouter);

  // ==========================================
  // 4. STATIC FILES / FRONTEND (SPA)
  // ==========================================
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`[PROD] Sirviendo frontend desde: ${distPath}`);
    
    // 1. Archivos estáticos con prioridad (assets, images, etc.)
    app.use(express.static(distPath, { index: false }));
    
    // 2. Catch-all para la SPA
    // IMPORTANTE: Solo atendemos peticiones que NO empiecen por /api
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next(); // Seguir al siguiente middleware (que no debería existir o devolver 404)
      }
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
