export const NUM_DEVICES = 50;
export const MIN_INTERVAL = 500;
export const MAX_INTERVAL = 2000;
export const FACTORY_ID = "factory_1";
export const SERVER_PORT = 3000;
export const KAFKA_GATEWAY_PORT = 9092;
export const KAFKA_BROKER = "192.168.10.48:9092";
export const KAFKA_TOPIC = "sensor-data";

// System Types and Thresholds
export const SYSTEM_TYPES = [
  { type: "pipe", range: [1, 10] },
  { type: "container", range: [11, 30] },
  { type: "battery_bank", range: [31, 50] }
];

// Thresholds 
export const THRESHOLDS = {
  pipe: {
    current: 2,       // Amps
    temperature: 70,   // Celsius
    pressure: 150      // PSI
  },
  container: {
    current: 30,
    temperature: 80,
    pressure: 180
  },
  battery_bank: {
    current: 50,
    temperature: 60,
    pressure: 120
  }


};


export const SCHEDULING_RULES = {
  idleMargin: 0.2,       // <20% of threshold = idle → turn off
  highLoadMargin: 0.8,   // >80% of threshold = high load → rotate/stagger
  coolingMargin: 0.85,   // >85% of temp threshold = cooling breaks
};
