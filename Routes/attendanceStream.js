const express = require("express");
const router = express.Router();

/* This array stores all connected dashboards */
let clients = [];

/* SSE endpoint */
router.get("/stream", (req, res) => {
  // Tell browser this is an event stream
  res.setHeader("Content-Type", "text/event-stream");

  // Prevent caching
  res.setHeader("Cache-Control", "no-cache");

  // Keep connection alive
  res.setHeader("Connection", "keep-alive");

  // Send headers immediately
  res.flushHeaders();

  // Save this dashboard connection
  clients.push(res);

  // If dashboard closes tab
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

/* Function to send update to all dashboards */
function sendAttendanceUpdate() {
  clients.forEach((client) => {
    client.write(`data: update\n\n`);
  });
}

module.exports = { router, sendAttendanceUpdate };
