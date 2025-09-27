import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

export default function HighConsumptionChart({ data }) {
    if (!data || data.length === 0) return <p>No high consumption devices</p>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)} kW`} />
<Bar dataKey="avgPower">
  {data.map((entry, index) => (
    <Cell key={index} fill={["#FF6B6B", "#FFD93D", "#4ECDC4", "#1E3A8A", "#8B5CF6"][index % 5]} />
  ))}
</Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
