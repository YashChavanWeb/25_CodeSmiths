const express = require("express");
const { NUM_DEVICES, SERVER_PORT } = require("./config");
const { log } = require("./utils/logger");
const { createBot } = require("./bots/deviceBot");

const app = express();
app.use(express.json());


// const SERVER_PORT = 3000cls

let readings = []; // store all incoming readings

// POST endpoint to receive data from bots
app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  console.log("📡 Received sensor data:", req.body);
  res.status(200).json({ message: "Data received" });
});

// GET endpoint to view all readings in browser
app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
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
