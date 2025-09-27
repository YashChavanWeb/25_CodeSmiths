import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import ChartCard from "./ChartCard";
import DeviceBinaryStatus from "./DeviceBinaryStatus";

export default function DeviceInsights({ data, cleanData, selectedDevice }) {
  if (!data || !selectedDevice || !cleanData) return null;

  // Filter device-specific data
  const deviceDataAgg = data.filter((row) => row["Device ID"] === selectedDevice);
  const deviceDataClean = cleanData.filter((row) => row["Device ID"] === selectedDevice);

  if (!deviceDataAgg.length || !deviceDataClean.length) return <p>No data for this device.</p>;

  const latest = deviceDataAgg[deviceDataAgg.length - 1];

  const pieData = [
    { name: "Power", value: latest.total_power },
    { name: "Safety Score", value: latest.safety_score },
  ];
  const COLORS = ["#16a34a", "#dc2626"];

  const radarData = deviceDataAgg.slice(-10).map((row) => ({
    Minute: row.Minute,
    Safety: row.safety_score,
    Power: row.total_power,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      {/* Power Trend */}
      <ChartCard title="Power Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={deviceDataAgg}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Minute" />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border p-2 rounded shadow">
                      <p><strong>Minute:</strong> {label}</p>
                      {payload.map((pl) => (
                        <p key={pl.dataKey}>
                          {pl.name}: {pl.value.toFixed(2)} <span className="text-gray-500">({pl.payload["Device ID"]})</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="total_power" stroke="#065f46" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Device ON/OFF Status */}
      <ChartCard title="Device ON/OFF Status">
        <DeviceBinaryStatus data={deviceDataClean} />
      </ChartCard>

      {/* Optional: Radar chart for recent Safety/Power */}
      <ChartCard title="Safety & Power (Last 10)">
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart outerRadius={80} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="Minute" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Safety Score" dataKey="Safety" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
            <Radar name="Power" dataKey="Power" stroke="#16a34a" fill="#16a34a" fillOpacity={0.4} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Optional: Power vs Safety Pie */}
      <ChartCard title="Power vs Safety (Latest)">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toFixed(2)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}
