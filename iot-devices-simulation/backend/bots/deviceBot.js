import { Readable } from "stream";
import { log } from "../utils/logger.js";
import { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID, SYSTEM_TYPES } from "../config.js";
import TemperatureSensor from "../sensors/TemperatureSensor.js";
import PressureSensor from "../sensors/PressureSensor.js";
import CurrentSensor from "../sensors/CurrentSensor.js";
import { shouldExcludeDevice, getFieldExclusions } from '../utils/deviceControl.js'; // Import the new module

export function createBot(id) {
  const tempSensor = new TemperatureSensor();
  const pressureSensor = new PressureSensor();
  const currentSensor = new CurrentSensor();

  let systemType = "unknown";
  for (const sys of SYSTEM_TYPES) {
    const deviceIdNumber = Number(id);
    if (deviceIdNumber >= sys.range[0] && deviceIdNumber <= sys.range[1]) systemType = sys.type;
    break;
  }

  const stream = new Readable({
    objectMode: true,
    read() { }
  });

  function emitReading() {
    // Initialize the reading with NaN values for excluded devices
    const reading = {
      factory_id: FACTORY_ID,
      device_id: `device_${id}`,
      system_type: systemType,
      temperature: NaN,
      pressure: NaN,
      current: NaN,
      timestamp: new Date().toISOString()
    };

    // If the device is not excluded, update the reading with real values
    if (!shouldExcludeDevice(id)) {
      const fieldExclusions = getFieldExclusions(id);

      if (!fieldExclusions.includes('temperature')) {
        reading.temperature = tempSensor.read();
      }
      if (!fieldExclusions.includes('pressure')) {
        reading.pressure = pressureSensor.read();
      }
      if (!fieldExclusions.includes('current')) {
        reading.current = currentSensor.read();
      }
    }

    log(`device_${id}`, "Generated reading:", reading);

    stream.push(reading);

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  const initialDelay = Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
  setTimeout(emitReading, initialDelay);

  return stream;
}
