import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PowerTrendChart({ data, selectedDevice }) {
  if (!data || data.length === 0) return null;

  const filteredData = selectedDevice
    ? data.filter((row) => row["Device ID"] === selectedDevice)
    : data;

  // Map data for kW display
  const chartData = filteredData.map((row) => ({
    ...row,
    total_power_kw: row.total_power / 1000, // Convert W → kW
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} syncId="plantSync">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Minute" />
        <YAxis unit=" kW" />
        <Tooltip
          formatter={(value, name, props) => {
            const deviceId = props?.payload?.["Device ID"] || "N/A";
            return [`${value} kW`, `${name} (${deviceId})`];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total_power_kw"
          stroke="#064e3b"
          dot={false}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
