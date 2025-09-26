/* eslint-disable react/prop-types */
import DeviceCard from "./DeviceCard";

export default function DeviceGrid({ devices }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4">
      {devices.map((d) => (
        <DeviceCard key={d.device_id} device={d} />
      ))}
    </div>
  );
}




