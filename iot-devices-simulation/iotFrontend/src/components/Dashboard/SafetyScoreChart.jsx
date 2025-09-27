import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

export default function SafetyScoreChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Minute" />
        <YAxis domain={[0, 100]} />
        
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            const row = payload[0].payload;
            return (
              <div className="bg-white border p-2 rounded shadow">
                <p><strong>Minute:</strong> {label}</p>
                <p><strong>Safety Score:</strong> {row.safety_score}</p>
                <p><strong>Device ID:</strong> {row["Device ID"] || "N/A"}</p>
              </div>
            );
          }}
        />

        <Legend />
        <ReferenceArea y1={0} y2={40} fill="#fecaca" fillOpacity={0.3} />
        <ReferenceArea y1={40} y2={70} fill="#fef3c7" fillOpacity={0.3} />
        <ReferenceArea y1={70} y2={100} fill="#d1fae5" fillOpacity={0.3} />

        <Area
          type="monotone"
          dataKey="safety_score"
          stroke="#dc2626"
          fill="#a7f3d0"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
