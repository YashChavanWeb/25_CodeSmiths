export default function SidebarLeft({ devices, toggleDevice, category }) {
  const filteredDevices =
    category === "all" ? devices : devices.filter(d => d.device_type === category);

  return (
    <div className="w-64 bg-white border-r border-gray-400 flex-shrink-0 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 p-4 flex-shrink-0">Control Devices</h2>
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {filteredDevices.map(d => (
          <div
            key={d.device_id}
            className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border hover:bg-gray-100 w-full"
          >
            <span className="truncate">{d.device_id}</span>
            <button
              onClick={() => toggleDevice(d.device_id)}
              className={`px-2 py-1 text-xs rounded ${
                d.is_on ? "bg-red-500 text-white" : "bg-green-500 text-white"
              }`}
            >
              {d.is_on ? "Switch Off" : "Switch On"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
