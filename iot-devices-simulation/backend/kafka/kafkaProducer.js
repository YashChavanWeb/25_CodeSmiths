import { Kafka } from "kafkajs";
import { KAFKA_BROKER, KAFKA_TOPIC, NUM_DEVICES, MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID, SYSTEM_TYPES, THRESHOLDS } from "../config.js";

// Kafka Setup
const kafka = new Kafka({
  clientId: "sensor-data-client",
  brokers: [KAFKA_BROKER],
});
const producer = kafka.producer();

// --- Helpers ---
function getSystemType(deviceId) {
  for (const sys of SYSTEM_TYPES) {
    if (deviceId >= sys.range[0] && deviceId <= sys.range[1]) {
      return sys.type;
    }
  }
  return "unknown";
}

function checkThresholds(systemType, data) {
  const limits = THRESHOLDS[systemType];
  return (
    data.current > limits.current ||
    data.temperature > limits.temperature ||
    data.pressure > limits.pressure
  );
}

function generateSensorData(deviceId) {
  const systemType = getSystemType(deviceId);

  const data = {
    factoryId: FACTORY_ID,
    deviceId,
    systemType,
    timestamp: new Date().toISOString(),
    current: +(Math.random() * 60).toFixed(2),
    temperature: +(Math.random() * 100).toFixed(2),
    pressure: +(Math.random() * 250).toFixed(2),
  };

  data.alert = checkThresholds(systemType, data);

  return data;
}

// --- Kafka Producer Logic ---
export const startProducer = async () => {
  await producer.connect();
  console.log("Kafka Producer connected");
  return producer;
};

export const sendToKafka = async (producer, message, key) => {
  try {
    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ key, value: JSON.stringify(message) }],
    });
    console.log(
      `Data sent to Kafka (Device ${key}) ${message.alert ? "ALERT" : ""}`
    );
  } catch (error) {
    console.error("Error sending data to Kafka:", error);
  }
};

export const disconnectProducer = async () => {
  await producer.disconnect();
  console.log("Kafka Producer disconnected");
};

// --- Start Simulation for Devices ---
export const startSimulation = async (producer) => {
  for (let i = 1; i <= NUM_DEVICES; i++) {
    const interval =
      Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) +
      MIN_INTERVAL;

    setInterval(async () => {
      const sensorData = generateSensorData(i);
      await sendToKafka(producer, sensorData, String(i));

      if (sensorData.alert) {
        console.log(
          `ALERT: Device ${i} (${sensorData.systemType}) exceeded threshold`,
          sensorData
        );
      }
    }, interval);
  }
};
