import express from "express";
import { createBot } from "./bots/deviceBot.js";
import cors from "cors";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import {
  startProducer,
  sendToKafka,
  disconnectProducer,
} from "./kafka/kafkaProducer.js";
import { NUM_DEVICES, SERVER_PORT, SYSTEM_TYPES, THRESHOLDS } from "./config.js";
import { startConsumer } from "./kafka/kafkaConsumer.js";


// CSV Writer setup
const csvWriter = createObjectCsvWriter({
  path: "./sensor_data.csv",
  header: [
    { id: "deviceId", title: "Device ID" },
    { id: "systemType", title: "System Type" },
    { id: "timestamp", title: "Timestamp" },
    { id: "temperature", title: "Temperature (°C)" },
    { id: "current", title: "Current (A)" },
    { id: "pressure", title: "Pressure (hPa)" },
    { id: "alert", title: "Alert" },
  ],
});

// Initialize CSV if not exists
if (!fs.existsSync("./sensor_data.csv")) {
  await csvWriter.writeRecords([]);
}

// Express app setup
const app = express();
app.use(express.json());
app.use(cors());

let readings = [];       // For POSTed sensor data
let botReadings = {};    // Latest reading per device from bots


// Active device tracking
const activeDevices = new Set(); // Track active devices (those that have been "included")

// Hold all SSE clients
const sseClients = new Set();

// POST endpoint for external sensor data
app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  res.status(200).json({ message: "Data received" });
});

// GET all POSTed sensor data
app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
});

// GET latest bot readings as JSON array
app.get("/api/bot-sensor-data", (req, res) => {
  res.json(Object.values(botReadings));
});

// SSE endpoint for live bot sensor data streaming
app.get("/api/bot-sensor-stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });
  res.flushHeaders();


  // Keep connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(":\n\n");
  }, 15000);

  // Add client
  sseClients.add(res);

  // Remove client on disconnect
  req.on("close", () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
  });
});

// Broadcast to all SSE clients
function broadcastToSSEClients(data) {
  const sseData = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(sseData);
  }
}

// --- Helper functions ---
function getSystemType(deviceId) {
  for (const sys of SYSTEM_TYPES) {
    if (deviceId >= sys.range[0] && deviceId <= sys.range[1]) {
      return sys.type;
    }
  }
  return "unknown";
}

function checkThresholds(systemType, reading) {
  const limits = THRESHOLDS[systemType];
  return (
    reading.current > limits.current ||
    reading.temperature > limits.temperature ||
    reading.pressure > limits.pressure
  );
}

// --- POST endpoint to switch device state ---
app.post("/api/device/:id/switch", (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  // Check if the action is valid
  if (action !== "on" && action !== "off") {
    return res.status(400).json({ message: "Invalid action. Use 'on' or 'off'." });
  }

  // Check if the device is already included
  if (activeDevices.has(id)) {
    return res.status(400).json({
      message: `Device ${id} is already included`
    });
  }

  // Include the device if the action is "on"
  if (action === "on") {
    activeDevices.add(id);
    return res.status(200).json({ message: `Device ${id} included successfully` });
  }

  // If action is "off", remove the device from the active list
  if (action === "off") {
    activeDevices.delete(id);
    return res.status(200).json({ message: `Device ${id} excluded successfully` });
  }
});

// --- Start Kafka Producer + Bots ---
const initializeKafkaProducer = async () => {
  const producer = await startProducer();

  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);

    botStream.on("data", async (reading) => {
      try {
        const systemType = getSystemType(i);
        const alert = checkThresholds(systemType, reading);

        const fullReading = {
          deviceId: `device_${i}`,
          systemType,
          timestamp: new Date().toISOString(),
          temperature: reading.temperature,
          current: reading.current,
          pressure: reading.pressure,
          alert,
        };

        // Update latest reading in memory
        botReadings[fullReading.deviceId] = fullReading;

        // Broadcast via SSE to all clients
        broadcastToSSEClients(fullReading);

        // Send to Kafka
        await sendToKafka(producer, fullReading, `device_${i}`);

        // Append to CSV
        await csvWriter.writeRecords([fullReading]);

        if (alert) {
          console.log(
            `ALERT: Device ${fullReading.deviceId} (${systemType}) exceeded threshold`,
            fullReading
          );
        } else {
          console.log(
            `Device ${fullReading.deviceId} data received`,
            fullReading
          );
        }
      } catch (error) {
        console.error(`Error processing data for device_${i}:`, error);
      }
    });
  }
};

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});

// --- Start system ---
const initializeSystem = async () => {
  await initializeKafkaProducer();
  await startConsumer(); // Consumer runs in parallel
};

initializeSystem().catch((err) =>
  console.error("Error initializing Kafka system", err)
);

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await disconnectProducer();
    console.log("\nKafka Producer Disconnected. Exiting...");
    process.exit(0);
  } catch (e) {
    console.error("Error during graceful shutdown", e);
    process.exit(1);
  }
});