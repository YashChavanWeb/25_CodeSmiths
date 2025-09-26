const express = require("express");
const { NUM_DEVICES, SERVER_PORT } = require("./config");
const { log } = require("./utils/logger");
const { createBot } = require("./bots/deviceBot");

const app = express();
app.use(express.json());

let readings = [];

app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  res.status(200).json({ message: "Data received" });
});

app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
});

app.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${SERVER_PORT}`);
});

// Start bots as streams
for (let i = 1; i <= NUM_DEVICES; i++) {
  const botStream = createBot(i);
  botStream.on("data", (reading) => {
    fetch(`http://localhost:${SERVER_PORT}/api/sensor-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading)
    }).catch(err => log(`sensor_${i}`, "Error sending data:", err));
  });
}