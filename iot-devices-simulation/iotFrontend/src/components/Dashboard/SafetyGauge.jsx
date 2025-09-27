import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from "recharts";

export default function SafetyGauge({ data }) {
  if (!data || data.length === 0) return null;

  const last = data[data.length - 1];
  const score = last.safety_score || 0;

  const gaugeData = [
    { name: "Score", value: score, fill: score > 70 ? "#16a34a" : score > 40 ? "#facc15" : "#dc2626" },
  ];

  return (
    <div style={{ width: "100%", height: 250 }}> {/* make sure container has fixed height */}
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={20}
          data={gaugeData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar minAngle={15} background clockwise dataKey="value" />
          <Legend
            iconSize={10}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
