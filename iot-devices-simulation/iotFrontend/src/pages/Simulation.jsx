// src/pages/Simulation.jsx
import { useState } from "react";

export default function Simulation() {
  const [deviceId, setDeviceId] = useState("");
  const [field, setField] = useState("");
  const [action, setAction] = useState("exclude");
  const [parametersInput, setParametersInput] = useState("");
  const [response, setResponse] = useState("");

  const getParametersArray = (input) =>
    input.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

  const handleFieldExclusion = async () => {
    if (!deviceId || !field) {
      setResponse(JSON.stringify({ error: "Device ID and Field are required." }, null, 2));
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/device/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, field, action }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ error: `Request failed: ${error.message}` }, null, 2));
    }
  };

  const handleFailureSimulation = async () => {
    if (!deviceId) {
      setResponse(JSON.stringify({ error: "Device ID is required." }, null, 2));
      return;
    }

    try {
      const parameters = getParametersArray(parametersInput);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/device/simulate-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, parameters }),
      }); 

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ error: `Request failed: ${error.message}` }, null, 2));
    }
  };

  const inputClasses =
    "w-full px-4 py-3 border border-gray-400 rounded-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500 placeholder-gray-500 text-base shadow-sm transition duration-150 ease-in-out";
  const primaryButtonClasses =
    "w-full md:w-auto mt-4 md:mt-0 px-6 py-3 font-semibold text-white bg-gray-800 rounded-full hover:bg-gray-900 focus:ring-4 focus:ring-gray-400/50 focus:outline-none transition duration-150 ease-in-out shadow-md hover:shadow-lg";
  const dangerButtonClasses =
    "w-full md:w-auto mt-4 md:mt-0 px-6 py-3 font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-800 focus:ring-4 focus:ring-gray-400/50 focus:outline-none transition duration-150 ease-in-out shadow-md hover:shadow-lg";
  const cardClasses = "bg-white p-6 md:p-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300";

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 border-b-2 border-gray-300 pb-2">
          IoT Device Simulation Console
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Control and simulate various states for connected devices.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Field Exclusion Card */}
        <div className={cardClasses}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-6 flex items-center">
            Field Data Control
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="field-device-id" className="block text-sm font-medium text-gray-600 mb-1">
                Device ID
              </label>
              <input
                id="field-device-id"
                type="text"
                placeholder="e.g., DEVICE-001"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="field-name" className="block text-sm font-medium text-gray-600 mb-1">
                  Field Name
                </label>
                <input
                  id="field-name"
                  type="text"
                  placeholder="temperature, current, or pressure"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="field-action" className="block text-sm font-medium text-gray-600 mb-1">
                  Action
                </label>
                <select
                  id="field-action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className={inputClasses + " appearance-none"}
                >
                  <option value="exclude">Exclude (Stop Reporting)</option>
                  <option value="include">Include (Start Reporting)</option>
                </select>
              </div>
            </div>

            <button onClick={handleFieldExclusion} className={primaryButtonClasses}>
              Apply Field Action
            </button>
          </div>
        </div>

        {/* Failure Simulation Card */}
        <div className={cardClasses}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-6 flex items-center">
            Failure Simulation
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="failure-device-id" className="block text-sm font-medium text-gray-600 mb-1">
                Device ID
              </label>
              <input
                id="failure-device-id"
                type="text"
                placeholder="e.g., DEVICE-001"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="failure-parameters" className="block text-sm font-medium text-gray-600 mb-1">
                Parameters (Comma Separated)
              </label>
              <input
                id="failure-parameters"
                type="text"
                placeholder="error_code, severity_level, component_name"
                value={parametersInput}
                onChange={(e) => setParametersInput(e.target.value)}
                className={inputClasses}
              />
              <p className="text-xs text-gray-400 mt-1">
                Example: `LOW_BATTERY, CRITICAL, PowerModule`
              </p>
            </div>
            <button onClick={handleFailureSimulation} className={dangerButtonClasses}>
              Simulate Failure State
            </button>
          </div>
        </div>
      </div>

      {/* Response Console */}
      <div className="bg-gray-900 p-6 md:p-8 rounded-lg shadow-inner border border-gray-700">
        <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
          API Response Console
        </h2>
        <div className="overflow-x-auto">
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-full text-sm whitespace-pre-wrap max-h-96">
            {response ? response : "Awaiting API response..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
