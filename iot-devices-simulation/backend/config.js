module.exports = {
  NUM_DEVICES: 50,
  MIN_INTERVAL: 500,
  MAX_INTERVAL: 2000,
  FACTORY_ID: "factory_1",
  SERVER_PORT: 5000,

  // System types and ranges
  SYSTEM_TYPES: [
    { type: "pipe", range: [1, 10] },
    { type: "container", range: [11, 30] },
    { type: "battery_bank", range: [31, 50] }
  ]
};
