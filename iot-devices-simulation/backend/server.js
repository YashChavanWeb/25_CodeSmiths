// server.js
const express = require("express");
const app = express();
const PORT = 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to receive sensor data
app.post("/api/sensor-data", (req, res) => {
    console.log("📡 Received sensor data:", req.body);
    res.status(200).json({ message: "Data received" });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});