// index.js
import express from "express";
import cors from "cors";
import { startProducer, disconnectProducer } from "./kafka/kafkaProducer.js";
import { startConsumer } from "./kafka/kafkaConsumer.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import botRoutes from "./routes/botRoutes.js";
import { initializeBotStream } from "./controllers/botController.js";
import { botReadings } from "./utils/state.js"; // Import botReadings from state.js
import alertRoutes from "./routes/alertRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", deviceRoutes);
app.use("/api", botRoutes);


app.use("/api", alertRoutes);

// Initialize system (Kafka, bots)
const initializeSystem = async () => {
  const producer = await startProducer();
  await startConsumer();
  initializeBotStream(producer);
};

// Start the system
initializeSystem().catch((err) => console.error("Error initializing Kafka system", err));

// Start the Express server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

// Graceful shutdown for Kafka producer and consumer
process.on("SIGINT", async () => {
  try {
    await disconnectProducer(); // Disconnect Kafka producer
    console.log("\nKafka Producer Disconnected.");
    process.exit(0); // Exit the process gracefully
  } catch (e) {
    console.error("Error during graceful shutdown:", e);
    process.exit(1); // Exit with an error code
  }
});
