import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AvgStatsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} syncId="plantSync">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Device ID" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Temperature (°C)" fill="#047857" />
        <Bar dataKey="Current (A)" fill="#22c55e" />
        <Bar dataKey="Pressure (Pa)" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
}
