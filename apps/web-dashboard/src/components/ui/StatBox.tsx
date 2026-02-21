export function StatBox({ label, value, sub, color = 'text-gray-900 dark:text-gray-100' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}
