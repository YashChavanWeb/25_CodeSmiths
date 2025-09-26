function log(deviceId, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${deviceId}] ${message}`, data ? JSON.stringify(data) : "");
}

module.exports = { log };
