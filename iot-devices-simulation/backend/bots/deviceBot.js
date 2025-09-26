const { Readable } = require("stream");
const { log } = require("../utils/logger");
const { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID, SYSTEM_TYPES } = require("../config");
const TemperatureSensor = require("../sensors/TemperatureSensor");
const PressureSensor = require("../sensors/PressureSensor");
const CurrentSensor = require("../sensors/CurrentSensor");

function createBot(id) {
  const tempSensor = new TemperatureSensor();
  const pressureSensor = new PressureSensor();
  const currentSensor = new CurrentSensor();

  // Assign system type based on device ID
  let systemType = "unknown";
  for (const sys of SYSTEM_TYPES) {
    if (id >= sys.range[0] && id <= sys.range[1]) systemType = sys.type;
  }

  const stream = new Readable({
    objectMode: true,
    read() {}
  });

  function emitReading() {
    const reading = {
      factory_id: FACTORY_ID,
      device_id: sensor_${id},
      system_type: systemType,
      temperature: tempSensor.read(),
      pressure: pressureSensor.read(),
      current: currentSensor.read(),
      timestamp: new Date().toISOString()
    };

    log(sensor_${id}, "Generated reading:", reading);
    stream.push(reading);

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  emitReading();

  return stream;
}

module.exports = { createBot };