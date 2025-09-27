import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DeviceBinaryStatus({ data }) {
  if (!data || data.length === 0) return <p>No data</p>;

  const onCount = data.filter(r => r.Status === "On").length;
  const offCount = data.filter(r => r.Status === "Off").length;

  const chartData = [
    { status: "On", count: onCount },
    { status: "Off", count: offCount },
  ];

  const COLORS = ["#16a34a", "#dc2626"]; // green for On, red for Off

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count">
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
