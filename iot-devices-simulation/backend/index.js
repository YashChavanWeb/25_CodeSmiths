// index.js
const express = require("express");
const cors = require("cors");
const { NUM_DEVICES, SERVER_PORT } = require("./config");
const { log } = require("./utils/logger");
const { createBot } = require("./bots/deviceBot");

const app = express();
app.use(express.json());
app.use(cors()); // allow frontend to fetch

// Store latest reading per device
let readings = {};

// POST endpoint to receive data from bots
app.post("/api/sensor-data", (req, res) => {
  const data = req.body;
  readings[data.device_id] = data; // overwrite old reading
  console.log("📡 Received sensor data:", data);
  res.status(200).json({ message: "Data received" });
});

// GET endpoint to fetch all latest readings
app.get("/api/sensor-data", (req, res) => {
  res.json(Object.values(readings));
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${SERVER_PORT}`);
});

// Start IoT simulator bots
console.log(`🚀 Starting IoT Simulator with ${NUM_DEVICES} devices...\n`);
for (let i = 1; i <= NUM_DEVICES; i++) {
  createBot(i);
}
