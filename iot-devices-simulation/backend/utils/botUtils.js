export function getSystemType(deviceId, SYSTEM_TYPES) {
    if (!Array.isArray(SYSTEM_TYPES)) {
        throw new Error('SYSTEM_TYPES must be an array');
    }

    for (const sys of SYSTEM_TYPES) {
        if (deviceId >= sys.range[0] && deviceId <= sys.range[1]) {
            return sys.type;
        }
    }
    return "unknown";
}

export function checkThresholds(systemType, reading, THRESHOLDS) {
    if (!THRESHOLDS[systemType]) {
        throw new Error(`No thresholds found for system type: ${systemType}`);
    }

    const limits = THRESHOLDS[systemType];

    return (
        reading.current > limits.current ||
        reading.temperature > limits.temperature ||
        reading.pressure > limits.pressure
    );
}

export function broadcastToSSEClients(sseClients, data) {
    if (sseClients.size === 0) {
        console.log("No SSE clients to broadcast to.");
        return;
    }

    const sseData = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
        client.write(sseData);
    }
}
