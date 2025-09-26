// List of devices to exclude completely
export const excludedDevices = new Set([]);

// List of fields to exclude for aspecific devices
export const fieldExclusions = {
    12: ['temperature'],
};

// Function to switch the state of a device
export function switchDeviceState(devices, deviceId, action) {
    const formattedId = deviceId.startsWith('device_') ? deviceId : `device_${deviceId}`;
    const device = devices.get(formattedId);

    if (!device) {
        throw new Error(`Device with id ${formattedId} not found.`);
    }

    if (action !== 'on' && action !== 'off') {
        throw new Error('Invalid action. Must be either "on" or "off".');
    }

    device.state = action;
    devices.set(formattedId, device);
    return device;
}

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

