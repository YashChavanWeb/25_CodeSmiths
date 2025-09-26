/* eslint-disable react/prop-types */
import DeviceCard from "./DeviceCard";

export default function DeviceGrid({ devices }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4">
      {devices.map((device) => (
        <DeviceCard key={device.device_id} device={device} />
      ))}
    </div>
  );
}
