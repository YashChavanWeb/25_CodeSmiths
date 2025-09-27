// exportConfig.js
import { THRESHOLDS, SCHEDULING_RULES } from "./config.js";
import fs from "fs";

fs.writeFileSync(
  "config.json",
  JSON.stringify({ THRESHOLDS, SCHEDULING_RULES }, null, 2)
);

console.log("config.json generated successfully.");
