import { Kafka } from "kafkajs";
import { KAFKA_BROKER, KAFKA_TOPIC } from "../config.js";

// Kafka Setup
const kafka = new Kafka({
  clientId: "sensor-data-consumer",
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: "sensor-monitor-group" });

export const startConsumer = async () => {
  await consumer.connect();
  console.log("Kafka Consumer connected");

  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value.toString();
        const data = JSON.parse(value);

        if (data.alert) {
          console.log(
            `ALERT DETECTED: Device ${data.deviceId} (${data.systemType}) exceeded threshold`,
            {
              current: data.current,
              temperature: data.temperature,
              pressure: data.pressure,
              time: data.timestamp,
            }
          );
        } else {
          console.log(
            `Device ${data.deviceId} data received`,
            {
              current: data.current,
              temperature: data.temperature,
              pressure: data.pressure,
              time: data.timestamp,
            }
          );
        }
      } catch (err) {
        console.error("Error parsing Kafka message:", err);
      }
    },
  });
};

export const disconnectConsumer = async () => {
  await consumer.disconnect();
  console.log("Kafka Consumer disconnected");
};



