// botStream.js
import { botReadings, initializeDeviceState, deviceStates, getFailureValue } from "../utils/state.js";
import { getFieldExclusions } from "../utils/deviceControl.js";
import { getSystemType, checkThresholds } from "../utils/botUtils.js";
import { sendToKafka } from "../kafka/kafkaProducer.js";
import fs from "fs";
import fetch from "node-fetch"; 
import { NUM_DEVICES, SERVER_PORT, SYSTEM_TYPES, THRESHOLDS } from "../config.js";
import { createBot } from "../bots/deviceBot.js";

// --- Removed CSV Writer setup completely ---

// Initialize device states
for (let i = 1; i <= NUM_DEVICES; i++) {
  initializeDeviceState(i);
}

// List of SSE clients
const sseClients = new Set();

// Function to broadcast data to all SSE clients
export const broadcastToSSEClients = (data) => {
  const sseData = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => client.write(sseData));
};

// SSE endpoint handler
export const getBotSensorStream = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(":ok\n\n");

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
};

// Function to initialize bot stream
export const initializeBotStream = (producer) => {
  console.log("Initializing bot stream...");

  for (let i = 1; i <= NUM_DEVICES; i++) {
    const botStream = createBot(i);
    botStream.on("data", (reading) => {
      fetch(`http://localhost:${SERVER_PORT}/api/sensor-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      }).catch((err) => {
        console.error(`Error sending data from sensor_${i}:`, err);
      });

      handleBotReading(reading, i, producer);
    });
  }

  setInterval(() => {
    const message = {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
    broadcastToSSEClients(message);
  }, 5000);

  producer.on("ready", () => {
    console.log("Kafka Producer is ready!");
  });
};

// Function to handle bot readings
export const handleBotReading = async (reading, i, producer) => {
  try {
    const deviceId = `device_${i}`;
    const deviceState = deviceStates.get(deviceId);
    const systemType = getSystemType(i, SYSTEM_TYPES);

    const isDeviceOff = deviceState && deviceState.state === "off";
    const excludedFields = getFieldExclusions(i);

    const sensorValues = {
      temperature: isDeviceOff || excludedFields.includes("temperature")
        ? NaN
        : getFailureValue(i, "temperature", reading.temperature),
      current: isDeviceOff || excludedFields.includes("current")
        ? NaN
        : getFailureValue(i, "current", reading.current),
      pressure: isDeviceOff || excludedFields.includes("pressure")
        ? NaN
        : getFailureValue(i, "pressure", reading.pressure),
    };

    const alert = isDeviceOff ? false : checkThresholds(systemType, reading, THRESHOLDS);

    const fullReading = {
      deviceId,
      systemType,
      timestamp: new Date().toISOString(),
      temperature: sensorValues.temperature,
      current: sensorValues.current,
      pressure: sensorValues.pressure,
      alert,
      state: deviceState ? deviceState.state : "on",
    };

    // Update in-memory readings
    botReadings[fullReading.deviceId] = fullReading;

    // Broadcast via SSE
    broadcastToSSEClients(fullReading);

    // Send to Kafka (✅ replaces CSV as long-term buffer)
    await sendToKafka(producer, fullReading, `device_${i}`);

    if (alert) {
      console.log(`ALERT: Device ${fullReading.deviceId} (${systemType}) exceeded threshold`, fullReading);
    } else {
      console.log(`Device ${fullReading.deviceId} data received`, fullReading);
    }
  } catch (error) {
    console.error(`Error processing data for device_${i}:`, error);
  }
};
