import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";

export default function AnomaliesDashboard({ selectedDevice, setSelectedDevice }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts`);

        const json = await res.json();
        setAlerts(json.alerts || []);
      } catch (err) {
        console.error("Error fetching anomalies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  if (loading) return <p className="text-center text-gray-500">Loading anomalies...</p>;
  if (!alerts.length) return <p className="text-center text-gray-500">No anomalies detected</p>;

  // Count anomalies per systemType
  const systemCount = alerts.reduce((acc, row) => {
    acc[row.systemType] = (acc[row.systemType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(systemCount).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];

  // Table data per device
  const deviceCount = alerts.reduce((acc, row) => {
    if (!acc[row.deviceId]) {
      acc[row.deviceId] = { count: 0, systemType: row.systemType, last: row };
    }
    acc[row.deviceId].count++;
    acc[row.deviceId].last = row; // keep latest
    return acc;
  }, {});

  const tableData = Object.entries(deviceCount).map(([id, info]) => ({
    deviceId: id,
    systemType: info.systemType,
    count: info.count,
    last: info.last,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border">
          <h3 className="text-lg font-semibold bg-gray-50 px-4 py-2 border-b">
            Device Anomalies
          </h3>
          <div className="overflow-x-auto max-h-60">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 border-b text-left">Device</th>
                  <th className="px-3 py-2 border-b text-left">System</th>
                  <th className="px-3 py-2 border-b text-center">Total Anomalies</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr
                    key={row.deviceId}
                    className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 cursor-pointer transition-colors duration-200"
                    title={`Temp: ${row.last.temperature}°C | Current: ${row.last.current}A | Pressure: ${row.last.pressure}hPa`}
                    onClick={() => setSelectedDevice(row.deviceId)}
                  >
                    <td className="px-3 py-2 border-b">{row.deviceId}</td>
                    <td className="px-3 py-2 border-b">{row.systemType}</td>
                    <td className="px-3 py-2 border-b text-center font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white shadow-md rounded-lg p-4 border flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Anomalies by System</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(value, name) => [`${value} anomaly${value > 1 ? "ies" : ""}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
