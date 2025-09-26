import { Readable } from "stream";
import { log } from "../utils/logger.js";
import { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID, SYSTEM_TYPES } from "../config.js";
import TemperatureSensor from "../sensors/TemperatureSensor.js";
import PressureSensor from "../sensors/PressureSensor.js";
import CurrentSensor from "../sensors/CurrentSensor.js";

export function createBot(id) {
  const tempSensor = new TemperatureSensor();
  const pressureSensor = new PressureSensor();
  const currentSensor = new CurrentSensor();

  let systemType = "unknown";
  for (const sys of SYSTEM_TYPES) {
    if (id >= sys.range[0] && id <= sys.range[1]) systemType = sys.type;
  }

  const stream = new Readable({
    objectMode: true,
    read() { }
  });

  let readingsSent = 0;  // Counter for the number of readings sent

  function emitReading() {
    if (readingsSent >= 3) {
      stream.push(null);  // End the stream after 3 readings
      return;
    }

    const reading = {
      factory_id: FACTORY_ID,
      device_id: `sensor_${id}`,
      system_type: systemType,
      temperature: tempSensor.read(),
      pressure: pressureSensor.read(),
      current: currentSensor.read(),
      timestamp: new Date().toISOString()
    };

    log(`sensor_${id}`, "Generated reading:", reading);
    stream.push(reading);

    readingsSent++;  // Increment the counter

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  // ✅ Add random initial delay for first reading
  const initialDelay = Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  setTimeout(emitReading, initialDelay);

  return stream;
}
