// server.js
const express = require("express");
const cors = require("cors");

const PORT = 5000;
const app = express();
app.use(express.json());
app.use(cors());

// Temporary in-memory storage
let readings = {};

// POST endpoint to receive sensor data
app.post("/api/sensor-data", (req, res) => {
  const data = req.body;
  readings[data.device_id] = data;
  console.log("📡 Received sensor data:", data);
  res.status(200).json({ message: "Data received" });
});

// GET endpoint to fetch latest readings
app.get("/api/sensor-data", (req, res) => {
  res.json(Object.values(readings));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
