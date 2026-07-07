import express from "express";
import cors from "cors";
import { createServer } from "http";
import { config } from "./config";
import { prisma } from "./prisma/client";
import { setupSocketServer } from "./socket";
import authRoutes from "./routes/auth";
import queueRoutes from "./routes/queue";
import swapRoutes from "./routes/swap";
import adminRoutes from "./routes/admin";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = config.clientUrl
  ? [config.clientUrl]
  : ["http://localhost:5173", "http://localhost:3000"];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Setup Socket.io
const { io, broadcastQueueUpdate } = setupSocketServer(httpServer);

// Export for use in other modules
export { broadcastQueueUpdate };

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log("[DB] Connected to PostgreSQL");

    httpServer.listen(config.port, () => {
      console.log(`[Server] Running on http://localhost:${config.port}`);
      console.log(`[Socket] WebSocket server ready`);
    });
  } catch (error) {
    console.error("[DB] Failed to connect:", error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] Shutting down...");
  httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
});
