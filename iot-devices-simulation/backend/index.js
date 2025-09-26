import express from "express";
import fetch from "node-fetch";
import { NUM_DEVICES, SERVER_PORT, KAFKA_GATEWAY_PORT } from "./config.js";
import { log } from "./utils/logger.js";
import { createBot } from "./bots/deviceBot.js";
import cors from "cors";
import axios from 'axios'; // For making HTTP requests to Kafka API

// Kafka Client setup
import { Kafka } from 'kafkajs';
const kafka = new Kafka({
  clientId: 'iot-simulator',
  brokers: ['localhost:9092'] // Assuming Kafka is running locally on port 9092
});
const producer = kafka.producer();

// Start Kafka producer
const startKafkaProducer = async () => {
  await producer.connect();
  console.log("✅ Connected to Kafka broker.");
};

startKafkaProducer().catch(err => {
  console.error("❌ Kafka producer connection error:", err.message);
});

// Express setup
const app = express();
app.use(express.json());
app.use(cors());

let readings = [];

// API to receive sensor data
app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  res.status(200).json({ message: "Data received" });
});

// API to get sensor data
app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`🚀 Server running on http://localhost:${SERVER_PORT}`);
});

// Function to simulate device readings
const generateReading = (deviceId) => ({
  device_id: deviceId,
  timestamp: Date.now(),
  temperature: (Math.random() * 30 + 20).toFixed(2), // 20-50°C
  current: (Math.random() * 5 + 1).toFixed(2),      // 1-6 Amps
  pressure: (Math.random() * 100 + 900).toFixed(2)  // 900-1000 hPa
});

// Function to send data to Kafka Gateway
const sendDataToKafka = async (deviceId) => {
  const data = generateReading(deviceId);

  try {
    // Produce message to Kafka topic (e.g., 'sensor-readings')
    await producer.send({
      topic: 'sensor-readings', // Kafka topic name
      messages: [
        {
          value: JSON.stringify(data),
        },
      ],
    });
    console.log(`✅ Device ${deviceId} sent data to Kafka.`);
  } catch (error) {
    console.error(`❌ Device ${deviceId} failed to send data to Kafka:`, error.message);
  }
};

// Start IoT simulator bots to send data periodically
console.log(`🚀 Starting IoT Data Generator with ${NUM_DEVICES} devices...\n`);

for (let i = 1; i <= NUM_DEVICES; i++) {
  // Each "bot" sends data every 3 seconds to Kafka
  setInterval(() => sendDataToKafka(i), 3000);
}

// Add a simple log for demonstration purposes
setInterval(() => {
  log(`📡 Generator active, sending data for ${NUM_DEVICES} devices...`);
}, 15000);
