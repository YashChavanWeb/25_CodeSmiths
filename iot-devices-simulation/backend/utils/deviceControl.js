// deviceControl.js

// List of devices to exclude completely
export const excludedDevices = new Set([]);

// List of fields to exclude for specific devices
export const fieldExclusions = {
    12: ['temperature'], // Device 12 should not have temperature
    // Add more device-specific field exclusions here in the future
};

export function shouldExcludeDevice(id) {
    return excludedDevices.has(id);
}

export function getFieldExclusions(id) {
    return fieldExclusions[id] || [];
}

// Dynamically add a device to excludedDevices
export function addExcludedDevice(id) {
    excludedDevices.add(id);
}

// Dynamically remove a device from excludedDevices
export function removeExcludedDevice(id) {
    excludedDevices.delete(id);
}
