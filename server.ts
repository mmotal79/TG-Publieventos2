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
  
  // Middleware para forzar JSON en todas las respuestas de API
  // IMPORTANTE: Este debe ir antes de cualquier router
  app.use("/api", (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[API ROUTING] Verificando ruta: ${req.method} ${req.path}`);
    next();
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      node_env: process.env.NODE_ENV
    });
  });

  // Montaje de Routers Específicos
  app.use("/api/users", (req, res, next) => {
    console.log(`[API ROUTING] Accediendo a UserRoutes: ${req.path}`);
    next();
  }, userRoutes);
  
  app.use("/api/catalogs", catalogRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/config", configRoutes);

  // ==========================================
  // 4. API FAIL-SAFE (Guardia Final)
  // ==========================================
  app.all("/api/*", (req, res) => {
    console.error(`[404 API CRITICAL] Endpoint no capturado por routers: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "ENDPOINT_NOT_FOUND",
      message: `La ruta '${req.originalUrl}' no existe en el servidor o el método ${req.method} no es válido.`,
      debug: {
        path: req.path,
        method: req.method
      }
    });
  });

  // ==========================================
  // 5. STATIC FILES / FRONTEND (SPA)
  // ==========================================
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`[SERVING] Archivos estáticos desde: ${distPath}`);
    
    // Servir archivos estáticos (JS, CSS, Imágenes)
    app.use(express.static(distPath, { index: false }));
    
    // CATCH-ALL DEFINITIVO PARA SPA
    // Usamos una expresión regular para que NUNCA capture rutas que empiecen por /api
    // Esto garantiza que si una API falla, devuelva el 404 JSON que definimos arriba
    app.get(/^(?!\/api).+/, (req, res) => {
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
