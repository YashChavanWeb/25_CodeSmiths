export default function ChartCard({ title, children }) {
  return (
    <div className="m-5 bg-white border-3 border-green-800 rounded-2xl shadow-lg p-4 hover:shadow-xl transition">
      <h2 className="text-lg font-semibold text-green-900 mb-2">{title}</h2>
      <div className="h-[300px]">{children}</div>
    </div>
  );
}
