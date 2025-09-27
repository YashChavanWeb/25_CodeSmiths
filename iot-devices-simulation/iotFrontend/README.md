To represent the failure simulation information in a table format, here’s how it could look:

| **Failure Type**                  | **API Endpoint**               | **Request Payload**                                             |
| --------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| Switch on/off device              | `/api/device/switch`           | `{ "deviceId": 7,"action": "off" }`                             |
| Sensor turns off                  | `/api/device/fields`           | `{ "deviceId": 12s, "field": "pressure", "action": "exclude" }`   |
| Parameter spikes and device fails | `/api/device/simulate-failure` | `{ "deviceId": 48, "parameters": ["temperature", "pressure"] }` |

This table breaks down the failure types, their associated API endpoints, and the corresponding payloads used for simulating each failure.
