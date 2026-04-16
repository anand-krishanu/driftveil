export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface1/90 backdrop-blur-md border border-borderPrimary p-3 text-xs shadow-md rounded-sm">
      <p className="text-subtle mb-1.5 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="my-0.5" style={{ color: p.color }}>
          {p.name}:{' '}
          <span className="text-heading font-mono ml-1 font-semibold">
            {p.value}
          </span>
        </p>
      ))}
    </div>
  )
}
