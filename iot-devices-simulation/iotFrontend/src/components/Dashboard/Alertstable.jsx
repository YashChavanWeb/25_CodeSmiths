import { useEffect, useState } from "react";

export default function AlertsTable() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/alerts"); // backend URL
        const data = await res.json();
        setAlerts(data); // assuming backend sends array of alerts
      } catch (err) {
        console.error("Error fetching alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) return <p>Loading alerts...</p>;
  if (!alerts.length) return <p>No alerts</p>;

  // Sort and take top 10
  const sorted = alerts
    .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
    .slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 border">Device</th>
            <th className="px-2 py-1 border">System</th>
            <th className="px-2 py-1 border">Temperature</th>
            <th className="px-2 py-1 border">Current</th>
            <th className="px-2 py-1 border">Pressure</th>
            <th className="px-2 py-1 border">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              <td className="px-2 py-1 border">{row["Device ID"]}</td>
              <td className="px-2 py-1 border">{row["System Type"]}</td>
              <td className="px-2 py-1 border">{row["Temperature (°C)"]}</td>
              <td className="px-2 py-1 border">{row["Current (A)"]}</td>
              <td className="px-2 py-1 border">{row["Pressure (hPa)"]}</td>
              <td className="px-2 py-1 border">{row.Timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
