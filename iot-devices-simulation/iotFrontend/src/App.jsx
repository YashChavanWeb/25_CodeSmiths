import { useEffect, useState } from "react";
import { fetchDevices } from "./services/api";
import DeviceGrid from "./components/DeviceGrid";

function App() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchDevices();
      setDevices(data);
    };
    load();
    const interval = setInterval(load, 3000); // refresh every 3 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-md">
        <h1 className="text-xl font-bold">IoT Device Dashboard</h1>
      </header>

      <DeviceGrid devices={devices} />
    </div>
  );
}

export default App;
