import { useEffect, useState } from "react";
import DeviceGrid from "../components/DeviceGrid.jsx";
import SidebarLeft from "../components/SidebarLeft.jsx";
import SidebarRight from "../components/SidebarRight.jsx";
import VoiceAssistant from "../components/VoiceAssistant.jsx"; // Import voice agent

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [listening, setListening] = useState(false); // Voice UI state

  // SSE for live device data
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

        setDevices((prevDevices) => {
          const index = prevDevices.findIndex(d => d.device_id === transformed.device_id);
          if (index !== -1) {
            const updated = [...prevDevices];
            const currentDevice = updated[index];
            updated[index] = {
              ...currentDevice,
              ...transformed,
              is_on: currentDevice.is_on
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
      console.error("❌ SSE error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  // Toggle device state (reversed logic)
  const toggleDevice = async (deviceId, currentState) => {
    const newAction = currentState === "on" ? "off" : "on"; // This is reversed to your request
    const cleanDeviceId = deviceId.replace(/^device_/, "");

    try {
      const res = await fetch("http://localhost:3000/api/device/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: cleanDeviceId, action: newAction }),
      });
      const data = await res.json();

      if (res.ok) {
        // Update the devices state with the new device status (reversed action)
        setDevices((prev) =>
          prev.map((d) =>
            d.device_id === deviceId
              ? { ...d, is_on: newAction === "off" } // Reversed logic here
              : d
          )
        );
      } else {
        alert(`Error: ${data.message || "Failed to switch device"}`);
      }
    } catch (error) {
      alert("Network error: Could not connect to server");
    }
  };

  // Filter devices
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

  // Handle starting/stopping voice recognition
  const handleStartVoice = () => {
    if (window.startVoiceRecognition) {
      window.startVoiceRecognition();
      setListening(true);
    }
  };
  const handleStopVoice = () => {
    if (window.stopVoiceRecognition) {
      window.stopVoiceRecognition();
      setListening(false);
    }
  };

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

        {/* Category Buttons & Search */}
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

        {/* Voice Assistant Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleStartVoice}
            disabled={listening}
            className={`px-4 py-2 rounded-lg text-white font-medium ${listening ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            Start Voice
          </button>
          <button
            onClick={handleStopVoice}
            disabled={!listening}
            className={`px-4 py-2 rounded-lg text-white font-medium ${!listening ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
          >
            Stop Voice
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <DeviceGrid devices={filteredDevices} />
        </div>
      </div>

      <SidebarRight anomalies={anomalies} />

      {/* Voice Assistant logic (hidden UI) */}
      <VoiceAssistant
        devices={devices}
        toggleDevice={toggleDevice}
        setCategory={setCategory}
      />
    </div>
  );
}
