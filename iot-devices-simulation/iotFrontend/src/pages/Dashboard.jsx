import { useEffect, useState } from "react";
import Papa from "papaparse";
import ChartCard from "../components/Dashboard/ChartCard";
import PowerTrendChart from "../components/Dashboard/PowerTrendChart";
import SafetyScoreChart from "../components/Dashboard/SafetyScoreChart";
import AvgStatsChart from "../components/Dashboard/AvgStatsChart";
import DeviceMetricsChart from "../components/Dashboard/DeviceMetricsChart";
import SafetyGauge from "../components/Dashboard/SafetyGauge";
import DeviceInsights from "../components/Dashboard/DeviceInsights";
import HighConsumptionChart from "../components/Dashboard/HighConsumptionChart"; // new
import AnomaliesChart from "../components/Dashboard/AnomaliesChart"; // new
import AlertsTable from "../components/Dashboard/AlertsTable";


export default function Dashboard() {
  const [aggregated, setAggregated] = useState([]);
  const [cleaned, setCleaned] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");

  // Parse CSVs
  useEffect(() => {
    const parseAgg = (row) => ({
      ...row,
      total_power: Number(row.total_power),
      safety_score: Number(row.safety_score),
      avg_temp: Number(row.avg_temp),
      avg_current: Number(row.avg_current),
      max_pressure: Number(row.max_pressure),
    });

    const parseClean = (row) => ({
      ...row,
      "Temperature (°C)": Number(row["Temperature (°C)"]),
      "Current (A)": Number(row["Current (A)"]),
      "Pressure (hPa)": Number(row["Pressure (hPa)"]),
      "Power (W)": Number(row["Power (W)"]),
      Alert: row.Alert === "true" || row.Alert === true,
      Anomaly: row.Anomaly === "-1" || row.Anomaly === -1,
    });

    Papa.parse("/sensor_data_aggregated.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => setAggregated(result.data.map(parseAgg)),
    });

    Papa.parse("/sensor_data_cleaned.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => setCleaned(result.data.map(parseClean)),
    });
  }, []);

  const devices = [...new Set(aggregated.map((row) => row["Device ID"]))];

  // Selected device data
  const aggData = selectedDevice
    ? aggregated.filter((r) => r["Device ID"] === selectedDevice)
    : aggregated;

  const cleanData = selectedDevice
    ? cleaned.filter((r) => r["Device ID"] === selectedDevice)
    : cleaned;

  // Factory-wide analytics
  const anomalies = cleaned.filter((row) => row.Alert || row.Anomaly);

  const highConsumptionDevices = [...new Set(cleaned.map((r) => r["Device ID"]))]
    .map((id) => {
      const devData = cleaned.filter((d) => d["Device ID"] === id);
      const avgPower =
        devData.reduce((acc, d) => acc + d["Power (W)"], 0) / devData.length / 1000; // kW

      return { id, avgPower };
    })
    .sort((a, b) => b.avgPower - a.avgPower)
    .slice(0, 5); // Top 5 devices by consumption

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-black text-white p-4 shadow-md flex justify-between items-center fixed z-10 top-0 min-w-screen">
        <h1 className="text-2xl font-bold">Smart Energy & Safety Dashboard</h1>
        <select
          className="text-black rounded px-2 py-1"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          <option value="">All Devices</option>
          {devices.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </header>

      {/* Main */}
      <main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
        {/* Left Section: Factory-wide analytics */}
        <section className="space-y-6">
          <ChartCard title="Average Device Stats">
            <AvgStatsChart data={cleanData} />
          </ChartCard>

          <ChartCard title="Power Consumption (Aggregated)">
            <PowerTrendChart data={aggData} />
          </ChartCard>

          <ChartCard title="Safety Profile (Aggregated)">
            <SafetyScoreChart data={aggData} />
          </ChartCard>

          <ChartCard title="Top 5 High Consumption Devices">
            <HighConsumptionChart data={highConsumptionDevices} />
          </ChartCard>

          <ChartCard title="Anomalies Overview">
            <AnomaliesChart data={anomalies} />
          </ChartCard>

          <ChartCard title="Last 10 Alerts">
            <AlertsTable data={cleaned} />
          </ChartCard>

        </section>

        {/* Right Section: Single Device Insights */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Device Insights</h2>
            <select
              className="text-black border rounded px-2 py-1"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="">Select Device</option>
              {devices.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {selectedDevice && (
            <>
              <ChartCard title={`Device Metrics - ${selectedDevice}`}>
                <DeviceMetricsChart
                  data={cleaned.filter((r) => r["Device ID"] === selectedDevice)}
                />
              </ChartCard>

              <DeviceInsights
                data={cleaned}       // <-- Pass cleaned data here
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
              />

              <ChartCard title="Safety Score">
                <SafetyGauge
                  data={cleaned.filter((r) => r["Device ID"] === selectedDevice)}
                />
              </ChartCard>
            </>
          )}

        </section>
      </main>
    </div>
  );
}
