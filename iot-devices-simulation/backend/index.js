const express = require("express");
const cors = require("cors");
const { NUM_DEVICES, SERVER_PORT } = require("./config");
const { log } = require("./utils/logger");
const { createBot } = require("./bots/deviceBot");

const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

let readings = {}; // latest readings per device

app.get("/api/sensor-data", (req, res) => {
  res.json(Object.values(readings));
});

app.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${SERVER_PORT}`);
});

// Start bots as streams
for (let i = 1; i <= NUM_DEVICES; i++) {
  const botStream = createBot(i);
  botStream.on("data", (reading) => {
    readings[reading.device_id] = reading;
    log(`sensor_${i}`, "Updated reading:", reading);
  });
}
