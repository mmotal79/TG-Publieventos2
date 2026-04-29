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
  
  // Health check - Simple y directo para verificar el servidor
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      node_env: process.env.NODE_ENV,
      port: PORT
    });
  });

  // Middleware de trazado de API para depuración en producción
  app.use("/api", (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[API_CALL] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });

  // Montaje de Routers directamente en app para evitar problemas de anidación
  app.use("/api/users", userRoutes);
  app.use("/api/catalogs", catalogRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/config", configRoutes);

  // GUARDIA FINAL PARA API: 
  // Cualquier petición que empiece por /api y llegue aquí es un 404 REAL de API
  app.all("/api/*", (req, res) => {
    console.error(`[404_API_HALT] Endpoint no encontrado: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API_ENDPOINT_NOT_FOUND",
      message: `El servidor no reconoce la ruta '${req.originalUrl}'. Verifica el prefijo /api/.`,
      method: req.method,
      path: req.path
    });
  });

  // ==========================================
  // 4. STATIC FILES / FRONTEND (SPA)
  // ==========================================
  if (process.env.NODE_ENV === "production" || process.env.RENDER === "true") {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`[PROD_MODE] Sirviendo archivos desde: ${distPath}`);
    
    // Sirve archivos estáticos (JS, CSS, Imágenes)
    app.use(express.static(distPath, { index: false }));
    
    // Catch-all para la SPA (React Router)
    app.get('*', (req, res) => {
      // Verificación de seguridad redundante
      if (req.originalUrl.startsWith('/api')) {
        console.warn(`[CATCHALL_LEAK] Una petición de API llegó al catch-all de SPA: ${req.originalUrl}`);
        return res.status(404).json({ 
          error: "API_REACHED_FRONTEND_CATCHALL",
          message: "Esta ruta de API no existe y casi se sirve como HTML." 
        });
      }
      
      const indexPath = path.resolve(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`[SPA_ERROR] No se pudo enviar index.html: ${err.message}`);
          res.status(500).send("Error interno: No se encontró el archivo de la aplicación (dist/index.html). Verifica el comando de build.");
        }
      });
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
