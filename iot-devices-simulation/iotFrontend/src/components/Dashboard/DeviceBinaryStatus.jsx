import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function DeviceBinaryStatus({ data }) {
  if (!data || data.length === 0)
    return <p className="text-center text-gray-500">No data</p>;

  // Prepare chart data
  const chartData = [
    {
      status: "On",
      count: data.filter((r) => r.Status === "On").length,
      reason: "Normal Operation",
      time: "N/A",
    },
    {
      status: "Off",
      count: data.filter((r) => r.Status === "Off").length,
      reason: "Maintenance / Fault",
      time: "2025-09-27 10:15",
    },
  ];

  const COLORS = ["#16a34a", "#dc2626"]; // green for On, red for Off

  // Custom tooltip with dummy reason and time
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { status, count, reason, time } = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm min-w-[150px]">
          <p className="font-semibold text-gray-700">{status}</p>
          <p className="text-gray-600">Count: {count}</p>
          <p className="text-gray-600">Reason: {reason}</p>
          <p className="text-gray-600">Time: {time}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <h3 className="text-center text-gray-700 font-bold mb-3">Device Status</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="status"
            tick={{ fill: "#374151", fontSize: 12 }}
            axisLine={false}
          />
          <YAxis tick={{ fill: "#374151", fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
