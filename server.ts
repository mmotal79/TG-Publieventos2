import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import userRoutes from "./src/routes/userRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mmotal:mmotal5379@cluster0.lcdpyvx.mongodb.net/uniformes_db?appName=Cluster0";
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User Management (Payroll) Routes
  app.use("/api/users", userRoutes);
  
  // Catalog Routes
  app.use("/api/catalogs", catalogRoutes);

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
