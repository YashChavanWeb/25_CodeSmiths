import { useEffect, useState } from "react";
import DeviceGrid from "../components/DeviceGrid.jsx";
import SidebarLeft from "../components/SidebarLeft.jsx";
import SidebarRight from "../components/SidebarRight.jsx";

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
          device_id: data.deviceId, // keep exactly what SSE sends
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

       setDevices((prevDevices) => {
  const index = prevDevices.findIndex(d => d.device_id === transformed.device_id);

  if (index !== -1) {
    const updated = [...prevDevices];
    const currentDevice = updated[index];

    updated[index] = {
      ...currentDevice,
      ...transformed,
      is_on: currentDevice.is_on // keep manual state until SSE confirms change
    };
    return updated;
  } else {
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

    return () => {
      eventSource.close();
    };
  }, []);

  const toggleDevice = async (deviceId, currentState) => {
    console.log("🔄 Toggling device:", deviceId, "Current state:", currentState);

    const newAction = currentState ? "off" : "on";

    // ❗ Fix: strip extra "device_" prefix before sending to backend
    const cleanDeviceId = deviceId.replace(/^device_/, "");
    console.log("🔍 Clean Device ID sent to backend:", cleanDeviceId);

    try {
      const requestBody = { deviceId: cleanDeviceId, action: newAction };
      console.log("📤 Sending to backend:", requestBody);

      const res = await fetch("http://localhost:3000/api/device/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      console.log("📥 Response status:", res.status);
      const data = await res.json();
      console.log("📥 Response data:", data);

      if (res.ok) {
        console.log("✅ Success - updating device state");
        setDevices((prev) =>
          prev.map((d) =>
            d.device_id === deviceId
              ? { ...d, is_on: data.state === "on" }
              : d
          )
        );
      } else {
        console.error("❌ Error switching device:", data.message || data);
        alert(`Error: ${data.message || "Failed to switch device"}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("Network error: Could not connect to server");
    }
  };

  const filteredDevices = devices.filter((d) => {
    if (category !== "all" && d.device_type !== category) return false;
    if (!search) return true;

    const query = search.toLowerCase().trim();
    return (
      d.device_id.toLowerCase().includes(query) ||
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

  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarLeft
        devices={devices}
        toggleDevice={toggleDevice}
        category={category}
        search={search}
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
