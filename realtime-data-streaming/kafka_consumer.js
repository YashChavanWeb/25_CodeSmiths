import { Kafka } from 'kafkajs';

// Setup Kafka client
const kafka = new Kafka({
    clientId: 'iot-data-consumer',
    brokers: ['192.168.137.35:9092'],  // Your Kafka broker IP and port
});

const consumer = kafka.consumer({ groupId: 'data-processing-group' });

const runConsumer = async () => {
    // Connecting to the Kafka broker
    await consumer.connect();
    console.log("🚀 Consumer Connected to Kafka Broker");

    // Subscribing to the topic
    await consumer.subscribe({ topic: 'sensor-data', fromBeginning: false });
    console.log("👂 Consumer Subscribed to topic: 'sensor-data'");

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const sensorData = JSON.parse(message.value.toString());

                console.log("-----------------------------------------");
                console.log("✅ Received message:");
                console.log(`Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`);
                console.log("Data:", sensorData);

                // --- CONSUMER LOGIC HERE ---
                // Example: Check for high temperature
                if (sensorData.temperature > 40) {
                    console.warn(`🚨 WARNING: High temperature detected for Device ${sensorData.device_id}: ${sensorData.temperature}°C`);
                }
                // ---------------------------

            } catch (error) {
                console.error("❌ Error processing message:", error);
            }
        },
    });
};

runConsumer().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await consumer.disconnect();
        console.log('\n👋 Consumer Disconnected. Exiting...');
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
});