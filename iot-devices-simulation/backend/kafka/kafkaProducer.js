import { Kafka } from 'kafkajs'; // Import Kafka client
import { KAFKA_BROKER, KAFKA_TOPIC } from "../config.js";

// Kafka Setup
const kafka = new Kafka({
    clientId: 'sensor-data-client',
    brokers: [KAFKA_BROKER], // Kafka broker (localhost:9092 or whatever your broker is)
});
const producer = kafka.producer();

// Kafka Producer Logic
export const startProducer = async () => {
    await producer.connect();
    console.log("Kafka Producer connected");

    return producer;  // Returning the producer for use in the main file
};

// Send data to Kafka
export const sendToKafka = async (producer, message, key) => {
    try {
        await producer.send({
            topic: KAFKA_TOPIC,
            messages: [
                {
                    key,  // Optional: You can use device_id as key
                    value: JSON.stringify(message)
                }
            ]
        });
        console.log(`Data sent to Kafka with key: ${key}`);
    } catch (error) {
        console.error("Error sending data to Kafka:", error);
    }
};

// Close Kafka Producer
export const disconnectProducer = async () => {
    await producer.disconnect();
    console.log("Kafka Producer disconnected");
};
