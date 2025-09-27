import { Readable } from "stream";
import { log } from "../utils/logger.js";
import { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID, SYSTEM_TYPES, THRESHOLDS } from "../config.js";
import TemperatureSensor from "../sensors/TemperatureSensor.js";
import PressureSensor from "../sensors/PressureSensor.js";
import CurrentSensor from "../sensors/CurrentSensor.js";
import { getFieldExclusions } from "../utils/deviceControl.js";

export function createBot(id) {
  const tempSensor = new TemperatureSensor();
  const pressureSensor = new PressureSensor();
  const currentSensor = new CurrentSensor();

  let systemType = "unknown";
  for (const sys of SYSTEM_TYPES) {
    const deviceIdNumber = Number(id);
    if (deviceIdNumber >= sys.range[0] && deviceIdNumber <= sys.range[1]) {
      systemType = sys.type;
      break;
    }
  }

  const thresholds = THRESHOLDS[systemType];

  const stream = new Readable({
    objectMode: true,
    read() {}
  });

  // Generate readings with very rare anomalies (~1% chance)
  function generateValue(base, variance, anomalyChance = 0.01, anomalyFactor = 1.2) {
    let value = base + (Math.random() * 2 - 1) * variance;

    if (Math.random() < anomalyChance) {
      value = base * anomalyFactor;
      log("anomaly", `⚠️ Rare anomaly simulated: ${value.toFixed(2)} (threshold base ${base})`);
    }

    return Math.max(0, parseFloat(value.toFixed(2)));
  }

  function emitReading() {
    const fieldExclusions = getFieldExclusions(id);

    const reading = {
      factory_id: FACTORY_ID,
      device_id: `device_${id}`,
      system_type: systemType,
      temperature: NaN,
      pressure: NaN,
      current: NaN,
      timestamp: new Date().toISOString(),
      alert: false
    };

    if (systemType !== "unknown" && thresholds) {
      if (!fieldExclusions.includes("temperature")) {
        reading.temperature = generateValue(thresholds.temperature * 0.85, 2, 0.01, 1.25);
      }
      if (!fieldExclusions.includes("pressure")) {
        reading.pressure = generateValue(thresholds.pressure * 0.85, 3, 0.01, 1.25);
      }
      if (!fieldExclusions.includes("current")) {
        reading.current = generateValue(thresholds.current * 0.85, 1, 0.01, 1.25);
      }

      // Mark alert if any value exceeds its threshold
      if (
        (reading.temperature && reading.temperature > thresholds.temperature) ||
        (reading.pressure && reading.pressure > thresholds.pressure) ||
        (reading.current && reading.current > thresholds.current)
      ) {
        reading.alert = true;
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
