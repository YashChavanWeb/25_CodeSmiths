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
import { addExcludedDevice, removeExcludedDevice, excludedDevices } from './utils/deviceControl.js'; // Import control functions

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

// Initialize the CSV file if it doesn't exist
if (!fs.existsSync("./sensor_data.csv")) {
  await csvWriter.writeRecords([]); // create an empty CSV file initially
}

const app = express();
app.use(express.json());
app.use(cors());

let readings = [];
let botReadings = {};

// Hold all SSE clients here
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

  const keepAliveInterval = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 15000);

  sseClients.add(res);

  req.on("close", () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
  });
});

// Helper to broadcast sensor reading to all SSE clients
function broadcastToSSEClients(data) {
  const sseData = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(sseData);
  }
}

// Endpoint to switch a device on or off
app.post("/api/device/:id/switch", (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // action should be "on" or "off"

  if (action === "off") {
    // Exclude device
    if (!excludedDevices.has(Number(id))) {
      addExcludedDevice(Number(id));
      return res.status(200).json({ message: `Device ${id} is now excluded (off)` });
    } else {
      return res.status(400).json({ message: `Device ${id} is already excluded` });
    }
  }

  if (action === "on") {
    // Include device
    if (excludedDevices.has(Number(id))) {
      removeExcludedDevice(Number(id));
      return res.status(200).json({ message: `Device ${id} is now included (on)` });
    } else {
      return res.status(400).json({ message: `Device ${id} is already included` });
    }
  }

  return res.status(400).json({ message: 'Invalid action. Use "on" or "off".' });
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
});

// --- Helper functions for alert checking ---
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

// Start Kafka Producer + Bots
const initializeKafkaProducer = async () => {
  const producer = await startProducer();

  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);
    botStream.on("data", async (reading) => {
      try {
        const systemType = getSystemType(i);
        const alert = checkThresholds(systemType, reading);

        const fullReading = {
          deviceId: `sensor_${i}`,
          timestamp: reading.timestamp,
          temperature: reading.temperature,
          current: reading.current,
          pressure: reading.pressure,
          alert,
          system_type: reading.system_type,
        };

        botReadings[fullReading.deviceId] = fullReading;

        broadcastToSSEClients(fullReading);

        await sendToKafka(producer, fullReading, `sensor_${i}`);

        await csvWriter.writeRecords([fullReading]);

        if (alert) {
          console.log(
            `⚠️ ALERT: Device ${fullReading.deviceId} (${systemType}) exceeded threshold`,
            fullReading
          );
        } else {
          console.log(
            `✅ Device ${fullReading.deviceId} data received`,
            fullReading
          );
        }
      } catch (error) {
        console.error(`Error processing data for sensor_${i}:`, error);
      }
    });
  }
};

// Start Kafka Producer + Consumer
const initializeSystem = async () => {
  await initializeKafkaProducer();
  await startConsumer();
};

initializeSystem().catch((err) =>
  console.error("Error initializing Kafka system", err)
);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  try {
    await disconnectProducer();
    console.log("\n👋 Kafka Producer Disconnected. Exiting...");
    process.exit(0);
  } catch (e) {
    console.error("Error during graceful shutdown", e);
    process.exit(1);
  }
});
