import { useEffect, useState } from "react";
import DeviceGrid from "./components/DeviceGrid";

export default function Dashboard() {
  const [devices, setDevices] = useState({}); // Use object for faster updates by device_id

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/api/bot-sensor-stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const newDevice = {
          device_id: data.device_id,
          device_type: data.system_type,
          status: "ok",
          metrics: {
            current_amp: data.current,
            temperature_c: data.temperature,
            pressure_kpa: data.pressure,
          },
          location: "line-1",
          timestamp: data.timestamp,
        };

        // Update state with new device reading
        setDevices(prevDevices => ({
          ...prevDevices,
          [newDevice.device_id]: newDevice,
        }));

      } catch (err) {
        console.error("❌ Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ SSE connection error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close(); // Clean up on unmount
    };
  }, []);

  // Convert device object to array for DeviceGrid
  const deviceList = Object.values(devices);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">IoT Device Dashboard</h1>
        <p className="mt-2 sm:mt-0 text-gray-500">
          Monitoring {deviceList.length} devices in real-time
        </p>
      </div>

      {/* Device Grid */}
      <DeviceGrid devices={deviceList} />
    </div>
  );
}
