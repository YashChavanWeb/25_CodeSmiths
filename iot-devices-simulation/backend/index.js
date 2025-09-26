import express from "express";
import { createBot } from "./bots/deviceBot.js";
import cors from "cors";
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import { startProducer, sendToKafka, disconnectProducer } from './kafka/kafkaProducer.js'; // Import Kafka logic
import { NUM_DEVICES, SERVER_PORT } from "./config.js";

// CSV Writer setup
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

// Initialize the CSV file if it doesn't exist
if (!fs.existsSync('./sensor_data.csv')) {
  await csvWriter.writeRecords([]); // create an empty CSV file initially
}

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());

let readings = [];      // For POSTed data (existing)
let botReadings = [];   // For Kafka bot generated data (new)

// POST endpoint to accept sensor data from external clients
app.post("/api/sensor-data", (req, res) => {
  readings.push(req.body);
  res.status(200).json({ message: "Data received" });
});

// GET endpoint to return POSTed sensor data
app.get("/api/sensor-data", (req, res) => {
  res.json(readings);
});

// NEW GET endpoint to return Kafka bot generated sensor data
app.get("/api/bot-sensor-data", (req, res) => {
  res.json(botReadings);
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
});

// Start Kafka Producer and Kafka bot streams
const initializeKafkaProducer = async () => {
  const producer = await startProducer();

  // Start bots as streams and send data to Kafka + CSV + store in botReadings array
  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);
    botStream.on("data", async (reading) => {
      try {
        const fullReading = {
          device_id: `sensor_${i}`,
          timestamp: new Date().toISOString(),
          temperature: reading.temperature,
          current: reading.current,
          pressure: reading.pressure
        };

        // Store in botReadings for frontend consumption
        botReadings.push(fullReading);

        // Send the sensor data to Kafka topic
        await sendToKafka(producer, fullReading, `sensor_${i}`);

        // Write the received data to the CSV file
        await csvWriter.writeRecords([fullReading]);

        console.log(`Device ${i} data written to CSV`);

      } catch (error) {
        console.error(`Error processing data for sensor_${i}:`, error);
      }
    });
  }
};

// Start Kafka Producer and Kafka bots
initializeKafkaProducer().catch((err) => console.error("Error initializing Kafka Producer", err));

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await disconnectProducer();  // Disconnect the Kafka producer
    console.log('\n👋 Kafka Producer Disconnected. Exiting...');
    process.exit(0);
  } catch (e) {
    console.error('Error during graceful shutdown', e);
    process.exit(1);
  }
});
