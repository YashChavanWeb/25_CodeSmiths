// A simple producer that sends data to the Kafka Gateway/Producer app
const axios = require('axios'); // Use axios for making HTTP requests
const { NUM_DEVICES = 5, KAFKA_GATEWAY_PORT = 3000 } = require("./config"); // Assume config exists
const { log } = require("./utils/logger"); // Assume logger exists

// Function to simulate a device reading
const generateReading = (deviceId) => ({
  device_id: deviceId,
  timestamp: Date.now(),
  temperature: (Math.random() * 30 + 20).toFixed(2), // 20-50 C
  current: (Math.random() * 5 + 1).toFixed(2),      // 1-6 Amps
  pressure: (Math.random() * 100 + 900).toFixed(2)  // 900-1000 hPa
});

// Function to send data to the Kafka Gateway
const sendData = async (deviceId) => {
  const data = generateReading(deviceId);

  try {
    // Send data to the API Gateway running on port 3000
    await axios.post(`http://localhost:${KAFKA_GATEWAY_PORT}/sensor-data`, data);
    // console.log(`✅ Device ${deviceId} sent data to Gateway.`);
  } catch (error) {
    // console.error(`❌ Device ${deviceId} failed to send data:`, error.message);
  }
};

// Start IoT simulator bots to send data periodically
console.log(`🚀 Starting IoT Data Generator with ${NUM_DEVICES} devices...\n`);

for (let i = 1; i <= NUM_DEVICES; i++) {
  // Each "bot" sends data every 3 seconds
  setInterval(() => sendData(i), 3000);
}

// Add a simple log for demonstration purposes
setInterval(() => {
  log(`📡 Generator active, sending data for ${NUM_DEVICES} devices...`);
}, 15000);