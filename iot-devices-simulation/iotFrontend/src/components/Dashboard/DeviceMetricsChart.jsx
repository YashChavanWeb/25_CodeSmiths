import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DeviceMetricsChart({ data }) {
  const formattedData = data.map((row) => ({
    Temperature: Number(row["Temperature (°C)"]),
    Current: Number(row["Current (A)"]),
    Pressure: Number(row["Pressure (hPa)"]),
    // Power: Number(row.Power),
    Timestamp: row.Timestamp_IST,
  }));

  // Colors for lines
  const COLORS = {
    Temperature: "#f87171", // red
    Current: "#34d399", // green
    Pressure: "#60a5fa", // blue
    Power: "#facc15", // yellow
  };

  // Custom tooltip for better styling
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm min-w-[180px]">
          <p className="font-bold text-gray-700 mb-1">{d.Timestamp}</p>
          <p className="text-red-500">Temperature: {d.Temperature} °C</p>
          <p className="text-green-500">Current: {d.Current} A</p>
          <p className="text-blue-500">Pressure: {d.Pressure} hPa</p>
          {/* <p className="text-yellow-500">Power: {d.Power} W</p> */}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="Timestamp" tick={{ fontSize: 12, fill: "#374151" }} />
        <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} />
        <Line type="monotone" dataKey="Temperature" stroke={COLORS.Temperature} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Current" stroke={COLORS.Current} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Pressure" stroke={COLORS.Pressure} strokeWidth={2} dot={{ r: 3 }} />
        {/* <Line type="monotone" dataKey="Power" stroke={COLORS.Power} strokeWidth={2} dot={{ r: 3 }} /> */}
      </LineChart>
    </ResponsiveContainer>
  );
}
