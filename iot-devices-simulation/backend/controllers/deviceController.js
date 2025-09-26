import { deviceStates, readings, initializeDeviceState } from "../utils/state.js";
import { switchDeviceState } from "../utils/deviceControl.js";
import { excludedDevices, getFieldExclusions } from "../utils/deviceControl.js"; // import from deviceControl.js

// POST endpoint for external sensor data
export const postSensorData = (req, res) => {
    const { id, field } = req.body;

    // Check if the device is excluded
    if (excludedDevices.has(id)) {
        return res.status(403).json({ message: "Device is excluded from data submissions." });
    }

    // Check if the field is excluded for the specific device
    const excludedFields = getFieldExclusions(id);
    if (excludedFields.includes(field)) {
        return res.status(403).json({ message: `Field "${field}" is excluded for this device.` });
    }

    readings.push(req.body);
    res.status(200).json({ message: "Data received" });
};

// GET all POSTed sensor data
export const getSensorData = (req, res) => {
    res.json(readings);
};

// POST endpoint to switch device state
export const switchDeviceStateHandler = (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    // Check if the device is excluded from state switching
    if (excludedDevices.has(id)) {
        return res.status(403).json({ message: "Device is excluded from state changes." });
    }

    try {
        // Import deviceStates instead of activeDevices
        const response = switchDeviceState(deviceStates, id, action);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
