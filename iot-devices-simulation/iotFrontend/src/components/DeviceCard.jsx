/* eslint-disable react/prop-types */
import { Zap, Thermometer, Gauge } from "lucide-react";

export default function DeviceCard({ device }) {
  const statusColors = {
    ok: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
    off: "bg-gray-400"
  };

  return (
    <div className="p-5 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-800">{device.device_id}</h3>
        <span
          className={`px-3 py-1 rounded-full text-white text-xs font-semibold shadow ${statusColors[device.status]} animate-pulse`}
        >
          {device.status.toUpperCase()}
        </span>
      </div>

      {/* Device Type */}
      <p className="text-sm text-gray-500 italic">{device.device_type}</p>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Zap className="w-5 h-5 text-indigo-500 mb-1" />
          <p className="font-semibold">{device.metrics.current_amp} A</p>
          <p className="text-xs text-gray-500">Current</p>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Thermometer className="w-5 h-5 text-red-500 mb-1" />
          <p className="font-semibold">{device.metrics.temperature_c} °C</p>
          <p className="text-xs text-gray-500">Temp</p>
        </div>
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center">
          <Gauge className="w-5 h-5 text-green-500 mb-1" />
          <p className="font-semibold">{device.metrics.pressure_kpa} kPa</p>
          <p className="text-xs text-gray-500">Pressure</p>
        </div>
      </div>

      {/* Location */}
      <p className="mt-4 text-xs text-gray-400">
        📍 Location: <span className="font-medium text-gray-600">{device.location}</span>
      </p>
    </div>
  );
}
