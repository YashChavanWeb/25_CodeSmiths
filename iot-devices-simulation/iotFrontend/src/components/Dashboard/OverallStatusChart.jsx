import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function OverallStatusChart({ data }) {
  if (!data || data.length === 0) return <p>No data</p>;

  const COLORS = ["#4ECDC4", "#FF6B6B"]; // On / Off

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
