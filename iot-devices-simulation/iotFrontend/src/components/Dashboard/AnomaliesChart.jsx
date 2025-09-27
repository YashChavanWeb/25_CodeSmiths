import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AnomaliesChart({ data }) {
  if (!data || data.length === 0) return <p>No anomalies detected</p>;

  // Count anomalies per device
  const anomalyCount = data.reduce((acc, row) => {
    acc[row["Device ID"]] = (acc[row["Device ID"]] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(anomalyCount).map(([id, count]) => ({ id, count }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="id" />
        <YAxis />
        <Tooltip />
<Bar dataKey="count">
  {chartData.map((entry, index) => (
    <Cell key={index} fill={["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6"][index % 5]} />
  ))}
</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
