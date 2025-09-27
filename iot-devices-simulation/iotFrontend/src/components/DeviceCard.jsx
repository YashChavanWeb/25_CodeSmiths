// DeviceCard.jsx

import { Zap, Thermometer, Gauge } from "lucide-react";

export default function DeviceCard({ device }) {
  const statusColors = {
    ok: "bg-green-500",
    warning: "bg-yellow-500",
    alert: "bg-red-500",
    off: "bg-gray-400",
  };

  // Determine status for display
  const displayStatus = device.is_on ? device.status : "off";

  // Optional: Add alert highlight
  const alertHighlight = device.status === "alert" ? "ring-2 ring-red-400 animate-pulse" : "";

  return (
    <div
      className={`p-5 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-shadow duration-300 ${alertHighlight}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-800">{device.device_id}</h3>
        <span
          className={`px-3 py-1 rounded-full text-white text-xs font-semibold shadow ${
            statusColors[displayStatus]
          } animate-pulse`}
        >
          {displayStatus.toUpperCase()}
        </span>
      </div>

      <p className="text-sm text-gray-500 italic">{device.device_type}</p>

      <div className="mt-4 grid grid-row-3 gap-3 text-[0.6em]">
        <div className="bg-white px-3 py-1 rounded-full border shadow-sm flex flex-row justify-between">
          <Zap className="w-4 h-4 text-indigo-500 mb-1" />
          <p className="font-semibold">{device.is_on ? device.metrics.current_amp : "-"} A</p>
          <p className="text-xs text-gray-500">Current</p>
        </div>

        <div className="bg-white px-3 py-1 rounded-full border shadow-sm flex flex-row justify-between">
          <Thermometer className="w-4 h-4 text-red-500 mb-1" />
          <p className="font-semibold">{device.is_on ? device.metrics.temperature_c : "-"} °C</p>
          <p className="text-xs text-gray-500">Temp</p>
        </div>

        <div className="bg-white px-3 py-1 rounded-full border shadow-sm flex flex-row justify-between">
          <Gauge className="w-4 h-4 text-green-500 mb-1" />
          <p className="font-semibold">{device.is_on ? device.metrics.pressure_kpa : "-"} kPa</p>
          <p className="text-xs text-gray-500">Pressure</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Location: <span className="font-medium text-gray-600">{device.location}</span>
      </p>
    </div>
  );
}
