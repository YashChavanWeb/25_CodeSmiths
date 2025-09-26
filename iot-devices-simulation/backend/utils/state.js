// state.js
// Store device states with their IDs and current state
export const deviceStates = new Map();
export const readings = [];
export const botReadings = {}; // Store bot readings

// Initialize device states
export function initializeDeviceState(deviceId) {
    deviceStates.set(`device_${deviceId}`, { id: `device_${deviceId}`, state: 'on' });
}
