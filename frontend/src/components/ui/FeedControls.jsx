export function FeedControls({ isRunning, chartData, onStart, onReset }) {
  return (
    <div className="flex items-center gap-3">
      {!isRunning && chartData.length === 0 && (
        <button
          onClick={onStart}
          className="px-4 py-1.5 text-xs font-semibold border border-warn text-warn bg-warn/5 hover:bg-warn hover:text-bgBase transition-all duration-200 cursor-pointer rounded-sm shadow-[0_0_10px_rgba(217,119,6,0.1)] hover:shadow-[0_0_15px_rgba(217,119,6,0.4)]"
        >
          Start Factory Feed
        </button>
      )}
      {(isRunning || chartData.length > 0) && (
        <button
          onClick={onReset}
          className="px-4 py-1.5 text-xs font-medium border border-borderSubtle text-subtle bg-surface1 hover:bg-surface2 hover:text-body transition-colors duration-150 cursor-pointer rounded-sm shadow-sm"
        >
          Reset
        </button>
      )}
      {isRunning && (
        <span className="flex items-center gap-1.5 text-[11px] text-safe font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse-glow shadow-[0_0_6px_rgba(22,163,74,0.8)]" />
          LIVE
        </span>
      )}
    </div>
  )
}
