import express from 'express';
import bodyParser from 'body-parser';
import { Kafka } from 'kafkajs';  // Import Kafka client

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Setup Kafka client
const kafka = new Kafka({
  clientId: 'iot-sensor-app',
  brokers: ['192.168.137.35:9092'],  // Your Kafka broker IP and port
});

const producer = kafka.producer();

async function connectKafka() {
  await producer.connect();
  console.log("🚀 Connected to Kafka Broker");
}
connectKafka();

// API Endpoint to receive data and send to Kafka
app.post('/sensor-data', async (req, res) => {
  const { device_id, timestamp, temperature, current, pressure } = req.body;

  if (!device_id || !timestamp || temperature === undefined || current === undefined || pressure === undefined) {
    return res.status(400).json({ error: 'Missing required sensor fields' });
  }

  const message = {
    device_id,
    timestamp,
    temperature: parseFloat(temperature),
    current: parseFloat(current),
    pressure: parseFloat(pressure),
  };

  console.log("📥 Incoming Sensor Data (API Gateway):", message);

  try {
    // Send message to Kafka topic "sensor-data"
    await producer.send({
      topic: 'sensor-data',
      messages: [
        { value: JSON.stringify(message), key: device_id.toString() } // Use device_id as key
      ],
    });

    res.status(200).json({ status: 'Sent to Kafka' });
  } catch (error) {
    console.error("❌ Error sending to Kafka", error);
    res.status(500).json({ error: 'Failed to send to Kafka' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Kafka Gateway/Producer API listening on http://localhost:${port}`);
});