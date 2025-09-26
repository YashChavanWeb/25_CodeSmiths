const { log } = require("../utils/logger");
const { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID } = require("../config");
const TemperatureSensor = require("../sensors/TemperatureSensor");
const PressureSensor = require("../sensors/PressureSensor");
const CurrentSensor = require("../sensors/CurrentSensor");

function createBot(id) {
  const tempSensor = new TemperatureSensor();
  const pressureSensor = new PressureSensor();
  const currentSensor = new CurrentSensor();

  function emitReading() {
    const reading = {
      factory_id: FACTORY_ID,
      device_id: `sensor_${id}`,
      temperature: tempSensor.read(),
      pressure: pressureSensor.read(),
      current: currentSensor.read(),
      timestamp: new Date().toISOString()
    };

    // DEBUG logs
    log(`sensor_${id}`, "Generated reading:", reading);

    // send reading to backend
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    fetch("http://localhost:5000/api/sensor-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading)
    })
      .then(res => res.json())
      .then(data => log(`sensor_${id}`, "Server response:", data))
      .catch(err => log(`sensor_${id}`, "Error sending data:", err));

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  emitReading();
}

module.exports = { createBot };
