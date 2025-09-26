export default function SidebarRight({ anomalies }) {
  return (
    <div className="w-64 bg-white border-l border-gray-400 flex-shrink-0 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 p-4 flex-shrink-0">Anomalies</h2>
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {anomalies.length === 0 ? (
          <p className="text-gray-500">No anomalies detected.</p>
        ) : (
          anomalies.map(a => (
            <div
              key={a.device_id}
              className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-300 w-full"
            >
              <span className="truncate">{a.device_id}</span>
              <span className="text-red-600 text-sm font-medium">⚠️</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
