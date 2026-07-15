const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

/**
 * Builds the Express app + Socket.io server without starting to listen,
 * so it can be exercised directly in tests with supertest.
 */
function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Clients join a room named after their user id, or "role:OPERATOR" / "role:ADMIN"
  // so operators and admins can watch the whole queue while clients only watch
  // their own orders.
  io.on("connection", (socket) => {
    socket.on("subscribe", ({ room }) => {
      if (typeof room === "string" && room.length < 100) {
        socket.join(room);
      }
    });

    socket.on("disconnect", () => {
      // no-op, socket.io cleans up room membership automatically
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", connections: io.engine.clientsCount });
  });

  // Called by the Django backend after every status transition.
  app.post("/broadcast/order-status", (req, res) => {
    const { orderId, clientId, status, previousStatus, note, updatedAt } = req.body || {};

    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status are required" });
    }

    const event = { orderId, status, previousStatus, note, updatedAt };

    io.to(`user:${clientId}`).emit("order:status", event);
    io.to("role:OPERATOR").emit("order:status", event);
    io.to("role:ADMIN").emit("order:status", event);

    return res.status(202).json({ delivered: true, event });
  });

  return { app, httpServer, io };
}

module.exports = { createApp };
