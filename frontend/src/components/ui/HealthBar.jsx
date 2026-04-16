export function HealthBar({ value }) {
  const colorClass = value >= 90 ? 'bg-safe' : value >= 75 ? 'bg-warn' : 'bg-critical'
  return (
    <div className="flex items-center gap-2">
      <div className="h-[3px] w-14 bg-borderPrimary shrink-0 overflow-hidden rounded-full">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-heading text-xs tabular-nums font-medium">{value}%</span>
    </div>
  )
}
