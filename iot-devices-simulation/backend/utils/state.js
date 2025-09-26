// state.js
// Store device states with their IDs and current state
export const deviceStates = new Map();
export const readings = [];
export const botReadings = {}; // Store bot readings
export const failingParameters = new Map(); // Track failing parameters and their base values
export const FAILURE_DURATION = 5000; // 5 seconds
export const GP_RATIO = 1.5; // Geometric progression ratio

// Initialize device states
export function initializeDeviceState(deviceId) {
    deviceStates.set(`device_${deviceId}`, { id: `device_${deviceId}`, state: 'on' });
}

// Constants for failure simulation
export const MAX_INCREASES = 3; // Number of increases before device turns off
export const INCREASE_INTERVAL = 500; // Time between increases in ms

// Start failure simulation for specified parameters
export function startFailure(deviceId, parameters) {
    const deviceKey = `device_${deviceId}`;
    const currentReadings = botReadings[deviceKey] || {};

    // Store initial values and start time for each parameter
    const failureState = {
        parameters: {},
        startTime: Date.now(),
        baseValues: {},
        increaseCount: 0
    };

    parameters.forEach(param => {
        failureState.parameters[param] = true;
        failureState.baseValues[param] = currentReadings[param] || {
            temperature: 25,
            pressure: 1,
            current: 2
        }[param];
    });

    failingParameters.set(deviceKey, failureState);

    // Schedule device turn off after MAX_INCREASES
    setTimeout(() => {
        const device = deviceStates.get(deviceKey);
        if (device) {
            device.state = 'off';
            deviceStates.set(deviceKey, device);
        }
        console.log(`Device ${deviceKey} turned off after ${MAX_INCREASES} increases`);
    }, INCREASE_INTERVAL * MAX_INCREASES);

    // Schedule cleanup after FAILURE_DURATION
    setTimeout(() => {
        failingParameters.delete(deviceKey);
    }, FAILURE_DURATION);
}

// Check if a parameter is failing and calculate its current value
export function getFailureValue(deviceId, parameter, normalValue) {
    const deviceKey = `device_${deviceId}`;
    const failureState = failingParameters.get(deviceKey);
    const deviceState = deviceStates.get(deviceKey);

    // If device is off, return NaN regardless of failure state
    if (deviceState && deviceState.state === 'off') {
        return NaN;
    }

    if (!failureState || !failureState.parameters[parameter]) {
        return normalValue;
    }

    const elapsedTime = Date.now() - failureState.startTime;

    // Calculate number of increases that have occurred
    const increases = Math.floor(elapsedTime / INCREASE_INTERVAL);

    if (increases >= MAX_INCREASES) {
        return NaN; // After max increases, return NaN
    }

    const baseValue = failureState.baseValues[parameter];
    // Apply geometric progression for the current number of increases
    return baseValue * Math.pow(GP_RATIO, increases);
}
