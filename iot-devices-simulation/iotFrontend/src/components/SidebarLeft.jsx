import { useNavigate } from "react-router-dom";

export default function SidebarLeft({ devices, toggleDevice, category, search }) {
  const navigate = useNavigate();

  // Filter devices based on search and category
  const filteredDevices = devices.filter(d => {
    if (category !== "all" && d.device_type !== category) return false;
    if (!search) return true;
    
    const query = search.toLowerCase().trim();
    return (
      d.device_id.toLowerCase().includes(query) ||
      d.device_type.toLowerCase().includes(query) ||
      d.status.toLowerCase().includes(query) ||
      d.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-64 bg-black/80 flex-shrink-0 flex flex-col h-full">
      <h2 className="text-white text-xl font-semibold mb-4 p-4 flex-shrink-0">
        Control Devices
      </h2>

      {/* Simulation Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => navigate("/simulation")}
          className="w-full py-2 text-sm font-semibold rounded-full bg-gray-700 text-white hover:bg-gray-600 transition"
        >
          Go to Simulation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {filteredDevices.length === 0 ? (
          <p className="text-center text-gray-500">No devices to display</p>
        ) : (
          filteredDevices.map((d) => (
            <div
              key={d.device_id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-full hover:bg-gray-100 w-full"
            >
              <span className="truncate font-medium">{d.device_id}</span>
              <button
                onClick={() => toggleDevice(d.device_id, d.is_on)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  d.is_on 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {d.is_on ? "Switch Off" : "Switch On"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
