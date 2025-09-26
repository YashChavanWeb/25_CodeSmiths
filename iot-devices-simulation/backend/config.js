export const NUM_DEVICES = 50;
export const MIN_INTERVAL = 500;
export const MAX_INTERVAL = 2000;
export const FACTORY_ID = "factory_1";
export const SERVER_PORT = 5000;
export const KAFKA_GATEWAY_PORT = 9092
export const KAFKA_BROKER = '192.168.137.35:9092';  // Kafka Broker IP and Port
export const KAFKA_TOPIC = 'sensor-data';

export const SYSTEM_TYPES = [
  { type: "pipe", range: [1, 10] },
  { type: "container", range: [11, 30] },
  { type: "battery_bank", range: [31, 50] }
];