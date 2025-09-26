import { useEffect, useState } from "react";
import DeviceGrid from "./components/DeviceGrid.jsx";
import SidebarLeft from "./components/SidebarLeft.jsx";
import SidebarRight from "./components/SidebarRight.jsx";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3000/api/bot-sensor-stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const transformed = {
          device_id: data.deviceId,
          device_type: data.systemType,
          status: data.alert ? "alert" : "ok",
          metrics: {
            current_amp: data.current,
            temperature_c: data.temperature,
            pressure_kpa: data.pressure,
          },
          location: "line-1",
          timestamp: data.timestamp,
          is_on: true,
        };

        // Update devices state
        setDevices((prevDevices) => {
          const index = prevDevices.findIndex(d => d.device_id === transformed.device_id);

          if (index !== -1) {
            // Device already exists, update it in place
            const updated = [...prevDevices];
            updated[index] = { ...updated[index], ...transformed };
            return updated;
          } else {
            // New device, add to the end (or wherever you want)
            return [...prevDevices, transformed];
          }
        });

      } catch (err) {
        console.error("❌ Error processing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ Error with SSE connection:", err);
      eventSource.close();
    };

    // Clean up the SSE connection on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  const filteredDevices = devices.filter((d) => {
    // Filter by category first
    if (category !== "all" && d.device_type !== category) return false;

    if (!search) return true;

    const query = search.toLowerCase().trim();

    // Check device_id, device_type, status, and location
    return (
      d.device_id.toString().toLowerCase().includes(query) ||
      d.device_type.toLowerCase().includes(query) ||
      d.status.toLowerCase().includes(query) ||
      d.location.toLowerCase().includes(query)
    );
  });


  const anomalies = devices.filter(
    (d) =>
      d.device_type === "container" &&
      (d.metrics.temperature_c > 80 || d.metrics.pressure_kpa > 120)
  );

  const toggleDevice = (id) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.device_id === id ? { ...d, is_on: !d.is_on } : d
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarLeft
        devices={devices}
        toggleDevice={toggleDevice}
        category={category}
      />

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">IOT Device Dashboard</h1>
          <p className="mt-2 sm:mt-0 text-gray-500">
            Monitoring {devices.length} devices in real-time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="flex gap-2">
            {["all", "pipe", "container", "battery_bank"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {cat === "all"
                  ? "All"
                  : cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by device ID, type, status, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-auto">
          <DeviceGrid devices={filteredDevices} />
        </div>
      </div>

      <SidebarRight anomalies={anomalies} />
    </div>
  );
} 