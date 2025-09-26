import { useEffect, useState } from "react";
import DeviceGrid from "./components/DeviceGrid";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

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

        // ✅ Keep only latest reading per device
        const latestByDevice = Object.values(
          transformed.reduce((acc, dev) => {
            acc[dev.device_id] = dev;
            return acc;
          }, {})
        );

        setDevices(latestByDevice);
      } catch (err) {
        console.error("❌ Error fetching devices:", err);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Apply category and search filter
  const filteredDevices = devices.filter((d) => {
    if (category !== "all" && d.device_type !== category) return false;
    if (!search) return true;

    const query = search.toLowerCase();

    // ✅ Exact device_id match
    if (d.device_id.toLowerCase() === query) return true;

    // ✅ Partial match for type, status, location
    return (
      d.device_type.toLowerCase().includes(query) ||
      d.status.toLowerCase().includes(query) ||
      d.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">IoT Device Dashboard</h1>
        <p className="mt-3 sm:mt-1 text-gray-600">
          Monitoring {devices.length} devices in real-time
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        {/* Category buttons */}
        <div className="flex gap-2">
          {["all", "pipe", "container", "battery_bank"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === cat
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

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by device ID, type, status, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Device Grid */}
      <DeviceGrid devices={filteredDevices} />
    </div>
  );
}
