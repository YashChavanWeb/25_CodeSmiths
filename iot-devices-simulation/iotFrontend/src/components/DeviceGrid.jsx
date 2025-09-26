import DeviceCard from "./DeviceCard";

export default function DeviceGrid({ devices }) {
  return (
    <div className="grid gap-6 p-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {devices.map((device) => (
        <DeviceCard key={device.device_id} device={device} />
      ))}
    </div>
  );
}
