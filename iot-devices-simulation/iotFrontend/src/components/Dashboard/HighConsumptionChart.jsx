import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function HighConsumptionChart({ data }) {
  if (!data || data.length === 0)
    return <p className="text-center text-gray-500">No high consumption devices</p>;

  // Colors for the top 5 devices
  const COLORS = ["#FF6B6B", "#FFD93D", "#4ECDC4", "#1E3A8A", "#8B5CF6"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { id, avgPower } = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded-lg shadow-md border border-gray-200 text-sm">
          <p className="font-semibold text-gray-700">{id}</p>
          <p>Avg Power: {avgPower.toFixed(2)} kW</p>
          <p>Reason: High Usage / Peak Hours</p>
          <p>Last Recorded: 2025-09-27 10:30</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg w-full h-64">
      <h3 className="text-center font-bold text-gray-700 mb-2">
        Top 5 High Consumption Devices
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="avgPower"
            nameKey="id"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={5}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
