const { NUM_DEVICES } = require("./config");
const { createBot } = require("./bots/deviceBot");

console.log(`🚀 Starting IoT Simulator with ${NUM_DEVICES} devices...\n`);

for (let i = 1; i <= NUM_DEVICES; i++) {
  createBot(i);
}á©