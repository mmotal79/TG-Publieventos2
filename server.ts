import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import userRoutes from "./src/routes/userRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";
import clientRoutes from "./src/routes/clientRoutes.js";
import configRoutes from "./src/routes/configRoutes.js";
import { initializeAdmin } from "./src/lib/dbInit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware for API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[SERVER] ${req.method} ${req.path}`);
    }
    next();
  });

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mmotal:mmotal5379@cluster0.lcdpyvx.mongodb.net/uniformes_db?appName=Cluster0";
  try {
    console.log("[SERVER] Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log("[SERVER] Conectado exitosamente a MongoDB Atlas");
    
    // Initialize default admin
    await initializeAdmin();
    
  } catch (error) {
    console.error("[SERVER] Error de conexión a MongoDB:", error);
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
  });

  // User Management (Payroll) Routes
  app.use("/api/users", userRoutes);
  
  // Catalog Routes
  app.use("/api/catalogs", catalogRoutes);

  // Client Routes
  app.use("/api/clients", clientRoutes);

  // Global Config Routes
  app.use("/api/config", configRoutes);

  // 404 for API routes - Stop them from falling through to Vite
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
