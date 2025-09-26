import { useEffect, useState } from "react";
import DeviceGrid from "./components/DeviceGrid";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/sensor-data");
        const data = await res.json();

        // Transform backend data to match DeviceCard format
        const transformed = data.map((d) => ({
          device_id: d.device_id,
          device_type: d.system_type,      
          status: "ok",                    
          metrics: {
            current_amp: d.current,
            temperature_c: d.temperature,
            pressure_kpa: d.pressure,
          },
          location: "line-1",              
          timestamp: d.timestamp,
        }));

        setDevices(transformed);
      } catch (err) {
        console.error("❌ Error fetching devices:", err);
      }
    };

    fetchDevices();

    // Poll every 3s for updates
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">IoT Device Dashboard</h1>
        <p className="mt-2 sm:mt-0 text-gray-500">
          Monitoring {devices.length} devices in real-time
        </p>
      </div>

      {/* Device Grid */}
      <DeviceGrid devices={devices} />
    </div>
  );
}
