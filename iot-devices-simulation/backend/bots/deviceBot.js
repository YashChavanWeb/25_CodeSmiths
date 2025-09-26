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

  function emitReading() {
    const reading = {
      factory_id: FACTORY_ID,
      device_id: `device_${id}`,
      system_type: systemType,
      temperature: tempSensor.read(),
      pressure: pressureSensor.read(),
      current: currentSensor.read(),
      timestamp: new Date().toISOString()
    };

    log(`device_${id}`, "Generated reading:", reading);
    stream.push(reading);

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  const initialDelay = Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  setTimeout(emitReading, initialDelay);

  return stream;
}
