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
  
  // Forzamos que cualquier ruta que empiece por /api sea tratada como JSON
  app.use("/api", (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[BACKEND_API] Recibida petición: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Montaje de Routers de Negocio
  app.use("/api/users", userRoutes);
  app.use("/api/catalogs", catalogRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/config", configRoutes);

  // --- API GUARD (Filtro de Seguridad) ---
  // Si llegamos aquí y la ruta empieza por /api, es un 404 de API real.
  // Evita que caiga accidentalmente en el catch-all del Frontend.
  app.all("/api/*", (req, res) => {
    console.error(`[API_404] Ruta inexistente solicitada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API_ENDPOINT_NOT_FOUND",
      message: `El servidor TG-Publieventos no reconoce el endpoint: ${req.originalUrl}`,
      tip: "Verifica que el nombre del recurso esté bien escrito en el Frontend."
    });
  });

  // ==========================================
  // 4. ARCHIVOS ESTÁTICOS Y SPA (Frontend)
  // ==========================================
  if (process.env.NODE_ENV === "production") {
    // Usamos process.cwd() para asegurar que dist se encuentre en la raíz del proyecto en Render
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`[FRONTEND] Sirviendo archivos estáticos desde: ${distPath}`);
    
    // Servir assets (JS, CSS, Imágenes)
    app.use(express.static(distPath, { index: false }));
    
    // El "Catch-all" para manejar el routing de React (Single Page Application)
    // Usamos app.get('*') al FINAL de todo para capturar el resto de rutas web
    app.get('*', (req, res) => {
      // Doble verificación: Si por alguna razón llegó una petición de API aquí, abortamos
      if (req.originalUrl.startsWith('/api')) {
        return; // Ya debería haber sido manejado por el API GUARD arriba
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
