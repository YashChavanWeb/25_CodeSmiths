import { useEffect, useState } from "react";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      setAlerts((prev) => [alert, ...prev]);
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>Real-Time Anomaly Alerts</h2>
      <ul>
        {alerts.map((a, index) => (
          <li key={index} style={{ color: a.urgent ? "red" : "black" }}>
            {a.urgent ? "⚠️ URGENT ALERT: " : ""}
            Device: {a.device_id} - {a.reasons.join(", ")} at {a.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}
