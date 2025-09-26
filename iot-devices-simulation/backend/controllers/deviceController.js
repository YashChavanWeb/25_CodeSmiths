import { deviceStates, readings, initializeDeviceState, startFailure, FAILURE_DURATION, GP_RATIO } from "../utils/state.js";
import { switchDeviceState, addFieldExclusion, removeFieldExclusion, excludedDevices, getFieldExclusions, fieldExclusions } from "../utils/deviceControl.js"; // import from deviceControl.js

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
// POST endpoint to simulate system failure
export const simulateFailure = (req, res) => {
    const { deviceId, parameters } = req.body;

    // Validate input
    if (!deviceId || !parameters || !Array.isArray(parameters) || parameters.length === 0) {
        return res.status(400).json({
            message: "Please provide deviceId and at least one parameter (temperature, current, or pressure)"
        });
    }

    // Validate parameters
    const validParams = ['temperature', 'current', 'pressure'];
    const invalidParams = parameters.filter(param => !validParams.includes(param));
    if (invalidParams.length > 0) {
        return res.status(400).json({
            message: `Invalid parameters: ${invalidParams.join(', ')}. Must be one or more of: temperature, current, pressure`
        });
    }

    try {
        startFailure(deviceId, parameters);
        return res.status(200).json({
            message: `Started failure simulation for device ${deviceId} parameters: ${parameters.join(', ')}`,
            duration: `${FAILURE_DURATION / 1000} seconds`,
            ratio: GP_RATIO
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST endpoint to manage field exclusions
export const manageFieldExclusions = (req, res) => {
    const { deviceId, field, action } = req.body;

    // Validate input
    if (!deviceId || !field || !action) {
        return res.status(400).json({
            message: "Missing required fields. Please provide deviceId, field, and action"
        });
    }

    // Validate field
    if (!['temperature', 'current', 'pressure'].includes(field)) {
        return res.status(400).json({
            message: "Invalid field. Must be one of: temperature, current, pressure"
        });
    }

    // Validate action
    if (!['exclude', 'include'].includes(action)) {
        return res.status(400).json({
            message: "Invalid action. Must be either 'exclude' or 'include'"
        });
    }

    try {
        if (action === 'exclude') {
            addFieldExclusion(deviceId, field);
        } else {
            removeFieldExclusion(deviceId, field);
        }

        return res.status(200).json({
            message: `Successfully ${action}d ${field} for device ${deviceId}`,
            currentExclusions: fieldExclusions[deviceId] || []
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

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
