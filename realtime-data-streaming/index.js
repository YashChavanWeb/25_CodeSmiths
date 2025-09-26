import express from 'express';
import bodyParser from 'body-parser';
// import { Kafka } from 'kafkajs'; // Kafka still commented out

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Kafka setup (commented)
/*
const kafka = new Kafka({
  clientId: 'iot-sensor-app',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

async function connectKafka() {
  await producer.connect();
  console.log("🚀 Connected to Kafka");
}
connectKafka();
*/

// API Endpoint
app.post('/sensor-data', async (req, res) => {
    const { device_id, timestamp, temperature, current, pressure } = req.body;

    if (!device_id || !timestamp || temperature === undefined || current === undefined || pressure === undefined) {
        return res.status(400).json({ error: 'Missing required sensor fields' });
    }

    console.log("📥 Incoming Sensor Data:", {
        device_id,
        timestamp,
        temperature,
        current,
        pressure
    });

    res.status(200).json({ status: 'Received sensor data successfully' });

    /*
    try {
      await producer.send({
        topic: 'sensor-data',
        messages: [
          { value: JSON.stringify(message) }
        ],
      });
  
      res.status(200).json({ status: 'Sent to Kafka' });
    } catch (error) {
      console.error("❌ Error sending to Kafka", error);
      res.status(500).json({ error: 'Failed to send to Kafka' });
    }
    */
});

// Start server
app.listen(port, () => {
    console.log(`🚀 API listening on http://localhost:${port}`);
});
