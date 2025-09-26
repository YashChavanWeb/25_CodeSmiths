import DeviceCard from "./DeviceCard.jsx";

export default function DeviceGrid({ devices }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {devices.map((d, index) => (
          <DeviceCard key={`${d.device_id}-${index}`} device={d} />
        ))}
      </div>
    </div>
  );
}
