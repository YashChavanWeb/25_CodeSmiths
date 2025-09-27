import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DeviceMetricsChart({ data }) {
  const formattedData = data.map((row) => ({
    Temperature: Number(row["Temperature (°C)"]),
    Current: Number(row["Current (A)"]),
    Pressure: Number(row["Pressure (hPa)"]),
    Power: Number(row.Power),
    Timestamp: row.Timestamp_IST,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Temperature" stroke="#047857" />
        <Line type="monotone" dataKey="Current" stroke="#065f46" />
        <Line type="monotone" dataKey="Pressure" stroke="#16a34a" />
        <Line type="monotone" dataKey="Power" stroke="#10b981" />
      </LineChart>
    </ResponsiveContainer>
  );
}
