const { log } = require("../utils/logger");
const { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID } = require("../config");

// Possible device types and statuses
const DEVICE_TYPES = ["pump", "fan", "motor", "valve"];
const STATUSES = ["ok", "warning", "critical", "off"];
const LOCATIONS = ["line-1", "line-2", "line-3"];

function createBot(id) {
  const baseTemp = 30 + Math.random() * 50;
  const basePress = 2 + Math.random() * 6;
  const baseCurr = 5 + Math.random() * 10;

  function emitReading() {
    const reading = {
      factory_id: FACTORY_ID,
      device_id: `sensor_${id}`,
      device_type: DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
      metrics: {
        current_amp: +(baseCurr + (Math.random() * 2 - 1)).toFixed(2),
        temperature_c: +(baseTemp + (Math.random() * 4 - 2)).toFixed(2),
        pressure_kpa: +(basePress + (Math.random() * 0.4 - 0.2)).toFixed(2),
      },
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      timestamp: new Date().toISOString()
    };

    log(`sensor_${id}`, "Generated reading:", reading);

    // Send data to backend
    const fetch = (...args) =>
      import("node-fetch").then(({ default: fetch }) => fetch(...args));

    fetch("http://localhost:5000/api/sensor-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading)
    })
      .then(res => res.json())
      .then(data => log(`sensor_${id}`, "Server response:", data))
      .catch(err => log(`sensor_${id}`, "Error sending data:", err));

    // Schedule next reading
    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  emitReading();
}

module.exports = { createBot };
