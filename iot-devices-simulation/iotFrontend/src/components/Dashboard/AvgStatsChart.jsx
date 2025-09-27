import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AvgStatsChart({ data }) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 50;

  // Paginate data
  const paginatedData =
  data.length > itemsPerPage
  ? data.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
  : data;
  
  return (
    <div className="flex flex-col w-full h-96">
      {/* Pagination controls */}
      {data.length > itemsPerPage && (
        <div className="absolute top-25 left-120 m-5 mt-2">
          <button
            className={`px-2 py-0.5 rounded bg-gray-300 text-gray-800 text-sm hover:bg-gray-400 ${
              page === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
          >
            Prev
          </button>
          <button
            className={`px-2 py-0.5 rounded bg-gray-300 text-gray-800 text-sm hover:bg-gray-400 ${
              (page + 1) * itemsPerPage >= data.length
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={() =>
              setPage((prev) =>
                Math.min(prev + 1, Math.floor(data.length / itemsPerPage))
              )
            }
            disabled={(page + 1) * itemsPerPage >= data.length}
          >
            Next
          </button>
        </div>
      )}
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={paginatedData} syncId="plantSync">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="Device ID"
            tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
            width={60}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#f3f4f6", borderRadius: 6 }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Temperature (°C)" fill="#047857" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Current (A)" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pressure (Pa)" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
