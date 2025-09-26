import express from "express";
import { createBot } from "./bots/deviceBot.js";
import cors from "cors";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import {
  startProducer,
  sendToKafka,
  disconnectProducer,
} from "./kafka/kafkaProducer.js"; // Import Kafka logic
import { NUM_DEVICES, SERVER_PORT, SYSTEM_TYPES, THRESHOLDS } from "./config.js";
import { startConsumer } from "./kafka/kafkaConsumer.js";

// CSV Writer setup
const csvWriter = createObjectCsvWriter({
  path: "./sensor_data.csv",
  header: [
    { id: "deviceId", title: "Device ID" },      // updated
    { id: "systemType", title: "System Type" },  // added
    { id: "timestamp", title: "Timestamp" },
    { id: "temperature", title: "Temperature (°C)" },
    { id: "current", title: "Current (A)" },
    { id: "pressure", title: "Pressure (hPa)" },
    { id: "alert", title: "Alert" },            // added
  ],
});

// Initialize the CSV file if it doesn't exist
if (!fs.existsSync("./sensor_data.csv")) {
  await csvWriter.writeRecords([]); // create an empty CSV file initially
}

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

let readings = []; // For POSTed data (existing)
let botReadings = []; // For Kafka bot generated data (new)

// POST endpoint to accept sensor data from external clients
app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  res.status(200).json({ message: "Data received" });
});

// GET endpoint to return POSTed sensor data
app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
});

// GET endpoint to return Kafka bot generated sensor data
app.get("/api/bot-sensor-data", (req, res) => {
  res.json(botReadings);
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

  // Start bots as streams and send data to Kafka + CSV + store in botReadings array
  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);
    botStream.on("data", async (reading) => {
      try {
        const systemType = getSystemType(i);
        const alert = checkThresholds(systemType, reading);

        const fullReading = {
          deviceId: `sensor_${i}`, // consistent with consumer
          systemType,
          timestamp: new Date().toISOString(),
          temperature: reading.temperature,
          current: reading.current,
          pressure: reading.pressure,
          alert,                   // true if thresholds exceeded
        };

        // Store in botReadings for frontend consumption
        botReadings.push(fullReading);

        // Send the sensor data to Kafka topic
        await sendToKafka(producer, fullReading, `sensor_${i}`);

        // Write the received data to the CSV file
        await csvWriter.writeRecords([fullReading]);

        // Log in console
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
  await startConsumer(); // Consumer runs in parallel
};

initializeSystem().catch((err) =>
  console.error("Error initializing Kafka system", err)
);

// Handle graceful shutdown
process.on("SIGINT", async () => {
  try {
    await disconnectProducer(); // Disconnect the Kafka producer
    console.log("\n👋 Kafka Producer Disconnected. Exiting...");
    process.exit(0);
  } catch (e) {
    console.error("Error during graceful shutdown", e);
    process.exit(1);
  }
});
