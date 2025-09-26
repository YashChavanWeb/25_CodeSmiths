import { useEffect, useState } from "react";
import DeviceGrid from "./components/DeviceGrid";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/sensor-data");
        const data = await res.json();
        setDevices(data);
      } catch (err) {
        console.error("❌ Error fetching devices:", err);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 3000); // poll every 3s
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
