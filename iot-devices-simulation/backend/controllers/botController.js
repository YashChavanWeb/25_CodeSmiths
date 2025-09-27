import { botReadings, initializeDeviceState, deviceStates, getFailureValue } from "../utils/state.js";
import { getFieldExclusions } from "../utils/deviceControl.js";
import { getSystemType, checkThresholds } from "../utils/botUtils.js";  // Import the function
import { sendToKafka } from "../kafka/kafkaProducer.js";
import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import fetch from "node-fetch"; // Required for sending data to API
import { NUM_DEVICES, SERVER_PORT, SYSTEM_TYPES, THRESHOLDS } from "../config.js";
import { createBot } from "../bots/deviceBot.js";

// CSV Writer setup
const csvWriter = createObjectCsvWriter({
    path: "./sensor_data.csv",
    header: [
        { id: "deviceId", title: "Device ID" },
        { id: "systemType", title: "System Type" },
        { id: "timestamp", title: "Timestamp" },
        { id: "temperature", title: "Temperature (°C)" },
        { id: "current", title: "Current (A)" },
        { id: "pressure", title: "Pressure (hPa)" },
        { id: "alert", title: "Alert" },
        { id: "status", title: "Status" },
    ],
});

// Initialize CSV if not exists
if (!fs.existsSync("./sensor_data.csv")) {
    await csvWriter.writeRecords([]);  // Initialize the CSV with no records if it doesn't exist
}

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

    // Initial message to keep connection open
    res.write(":ok\n\n");

    // Add this client to the list of active clients
    sseClients.add(res);

    // Remove client when they disconnect
    req.on("close", () => {
        sseClients.delete(res);
    });
};

// Function to initialize bot stream (create bots and send data to API)
export const initializeBotStream = (producer) => {
    console.log("Initializing bot stream...");

    // Start bots as streams (similar to the second code snippet)
    for (let i = 1; i <= NUM_DEVICES; i++) {
        const botStream = createBot(i);  // Assuming createBot creates a stream for each device
        botStream.on("data", (reading) => {
            // Send bot reading to the HTTP API
            fetch(`http://localhost:${SERVER_PORT}/api/sensor-data`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reading),
            }).catch((err) => {
                console.error(`Error sending data from sensor_${i}:`, err);
            });

            // Process reading (e.g., check thresholds, broadcast to SSE clients, etc.)
            handleBotReading(reading, i, producer);
        });
    }

    // Optionally, send an initial "heartbeat" to all SSE clients
    setInterval(() => {
        const message = {
            status: "alive",
            timestamp: new Date().toISOString(),
        };
        broadcastToSSEClients(message); // Send heartbeat to all connected SSE clients
    }, 5000); // Send heartbeat every 5 seconds

    // If Kafka is involved, you can set up the producer here
    producer.on("ready", () => {
        console.log("Kafka Producer is ready!");
    });
};

// Function to handle bot readings (process the data, check thresholds, and send it to Kafka)
export const handleBotReading = async (reading, i, producer) => {
    // Determine device status based on readings
    const isAllNaN = [reading.temperature, reading.current, reading.pressure].every(val => isNaN(val));
    reading.status = isAllNaN ? 'off' : 'on';
    try {
        const deviceId = `device_${i}`;
        const deviceState = deviceStates.get(deviceId);
        const systemType = getSystemType(i, SYSTEM_TYPES);  // Passing SYSTEM_TYPES as required

        // Check if device is turned off
        const isDeviceOff = deviceState && deviceState.state === 'off';

        // Get excluded fields for this device
        const excludedFields = getFieldExclusions(i);

        // Get sensor values considering device state, exclusions, and failures
        const sensorValues = {
            temperature: isDeviceOff || excludedFields.includes('temperature') ?
                NaN : getFailureValue(i, 'temperature', reading.temperature),
            current: isDeviceOff || excludedFields.includes('current') ?
                NaN : getFailureValue(i, 'current', reading.current),
            pressure: isDeviceOff || excludedFields.includes('pressure') ?
                NaN : getFailureValue(i, 'pressure', reading.pressure)
        };

        const alert = isDeviceOff ? false : checkThresholds(systemType, reading, THRESHOLDS);

        // Check if all sensor values are NaN to determine status
        const isAllNaN = [sensorValues.temperature, sensorValues.current, sensorValues.pressure]
            .every(val => isNaN(val));

        const fullReading = {
            deviceId,
            systemType,
            timestamp: new Date().toISOString(),
            temperature: sensorValues.temperature,
            current: sensorValues.current,
            pressure: sensorValues.pressure,
            alert,
            status: isAllNaN ? 'Off' : 'On' // Set status based on sensor values
        };

        // Update latest reading in memory
        botReadings[fullReading.deviceId] = fullReading;

        // Broadcast via SSE to all clients (using local function)
        broadcastToSSEClients(fullReading);

        // Send to Kafka
        await sendToKafka(producer, fullReading, `device_${i}`);

        // Append to CSV
        await csvWriter.writeRecords([fullReading]);

        if (alert) {
            console.log(
                `ALERT: Device ${fullReading.deviceId} (${systemType}) exceeded threshold`,
                fullReading
            );
        } else {
            console.log(
                `Device ${fullReading.deviceId} data received`,
                fullReading
            );
        }
    } catch (error) {
        console.error(`Error processing data for device_${i}:`, error);
    }
};

