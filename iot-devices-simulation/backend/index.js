import express from "express";
import { createBot } from "./bots/deviceBot.js";
import cors from "cors";
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import { startProducer, sendToKafka, disconnectProducer } from './kafka/kafkaProducer.js';
import { NUM_DEVICES, SERVER_PORT } from "./config.js";

const csvWriter = createObjectCsvWriter({
  path: './sensor_data.csv',
  header: [
    { id: 'device_id', title: 'Device ID' },
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'temperature', title: 'Temperature (°C)' },
    { id: 'current', title: 'Current (A)' },
    { id: 'pressure', title: 'Pressure (hPa)' },
  ],
});

if (!fs.existsSync('./sensor_data.csv')) {
  await csvWriter.writeRecords([]); // create an empty CSV file initially
}

const app = express();
app.use(express.json());
app.use(cors());

let readings = [];      // For POSTed data from external clients
let botReadings = {};   // Latest reading per device from bots

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

// GET latest bot readings as JSON array (for fallback)
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

  // Send a comment to keep connection alive every 15 seconds
  const keepAliveInterval = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 15000);

  // Add this client connection to the set
  sseClients.add(res);

  // Remove client when connection closes
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

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
});

// Start Kafka Producer and bots
const initializeKafkaProducer = async () => {
  const producer = await startProducer();

  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);
    botStream.on("data", async (reading) => {
      try {
        const fullReading = {
          device_id: `sensor_${i}`,
          timestamp: reading.timestamp, // use bot's timestamp
          temperature: reading.temperature,
          current: reading.current,
          pressure: reading.pressure,
          system_type: reading.system_type,
        };

        // Update latest reading in memory
        botReadings[fullReading.device_id] = fullReading;

        // Broadcast via SSE to all connected clients
        broadcastToSSEClients(fullReading);

        // Send to Kafka
        await sendToKafka(producer, fullReading, `sensor_${i}`);

        // Append to CSV
        await csvWriter.writeRecords([fullReading]);

        console.log(`Device ${i} data written to CSV and broadcasted`);

      } catch (error) {
        console.error(`Error processing data for sensor_${i}:`, error);
      }
    });
  }
};

initializeKafkaProducer().catch((err) => console.error("Error initializing Kafka Producer", err));

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await disconnectProducer();
    console.log('\n👋 Kafka Producer Disconnected. Exiting...');
    process.exit(0);
  } catch (e) {
    console.error('Error during graceful shutdown', e);
    process.exit(1);
  }
});
