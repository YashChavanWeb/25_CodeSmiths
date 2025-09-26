const { log } = require("../utils/logger");
const { MIN_INTERVAL, MAX_INTERVAL, FACTORY_ID } = require("../config");

function createBot(id) {
  const baseTemp = 30 + Math.random() * 50;
  const basePress = 2 + Math.random() * 6;
  const baseCurr = 5 + Math.random() * 10;

  function emitReading() {
    const reading = {
      factory_id: FACTORY_ID,
      device_id: `sensor_${id}`,
      temperature: +(baseTemp + (Math.random() * 4 - 2)).toFixed(2),
      pressure: +(basePress + (Math.random() * 0.4 - 0.2)).toFixed(2),
      current: +(baseCurr + (Math.random() * 2 - 1)).toFixed(2),
      timestamp: new Date().toISOString()
    };

    log(`sensor_${id}`, "Generated reading:", reading);

    const delay = MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
    setTimeout(emitReading, delay);
  }

  emitReading();
}

module.exports = { createBot };
