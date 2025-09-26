// controllers/deviceController.js
import { activeDevices, readings } from "../utils/state.js";

// POST endpoint for external sensor data
export const postSensorData = (req, res) => {
    readings.push(req.body);
    res.status(200).json({ message: "Data received" });
};

// GET all POSTed sensor data
export const getSensorData = (req, res) => {
    res.json(readings);
};

// POST endpoint to switch device state
export const switchDeviceState = (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    if (action !== "on" && action !== "off") {
        return res.status(400).json({ message: "Invalid action. Use 'on' or 'off'." });
    }

    if (activeDevices.has(id)) {
        return res.status(400).json({
            message: `Device ${id} is already included`
        });
    }

    if (action === "on") {
        activeDevices.add(id);
        return res.status(200).json({ message: `Device ${id} included successfully` });
    }

    if (action === "off") {
        activeDevices.delete(id);
        return res.status(200).json({ message: `Device ${id} excluded successfully` });
    }
};
