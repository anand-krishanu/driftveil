import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MACHINES } from '../../data/machines'

export function TopNav({ theme, onToggleTheme }) {
  const location = useLocation()
  const [now, setNow] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }))

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 h-[52px] border-b border-borderPrimary bg-surface1/60 backdrop-blur-md shrink-0">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-4 no-underline group hover:opacity-80 transition-opacity">
        <span className="text-[15px] font-bold text-heading tracking-tight flex items-center">
          DRIFT<span className="text-warn drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]">VEIL</span>
        </span>
        <span className="text-borderPrimary">|</span>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-subtle">
          Industrial Drift Intelligence
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="flex h-[52px] items-center">
        {/* Role Views */}
        {[
          { to: '/',         label: 'Plant Operator' },
          { to: '/engineer', label: 'Maintenance Engineer' },
        ].map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`px-[18px] h-full flex items-center text-xs font-semibold no-underline border-b-2 transition-colors duration-200 ${
                active ? 'border-warn text-heading' : 'border-transparent text-subtle hover:text-body'
              }`}
            >
              {label}
            </Link>
          )
        })}

        {/* Separator */}
        <div className="w-px h-6 bg-borderPrimary mx-2" />

        {/* Info Pages */}
        {[
          { to: '/architecture', label: 'Architecture' },
          { to: '/features',     label: 'Why DriftVeil' },
        ].map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`px-3.5 h-full flex items-center text-[11px] font-semibold no-underline border-b-2 transition-colors duration-200 ${
                active ? 'border-safe text-safe shadow-[0_4px_10px_-4px_rgba(22,163,74,0.4)]' : 'border-transparent text-muted hover:text-subtle'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status + Theme */}
      <div className="flex items-center gap-3.5 text-[11px]">
        <span className="flex items-center gap-1.5 text-safe font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-glow" />
          Monitoring {MACHINES.length} Active Nodes
        </span>
        <span className="text-borderPrimary">|</span>
        <span className="text-subtle font-mono uppercase tracking-wider text-[10px]">SERVER CONNECTED</span>
        <span className="text-borderPrimary">|</span>
        <span className="text-muted font-mono">{now}</span>
        <span className="text-borderPrimary">|</span>
        <button
          onClick={onToggleTheme}
          className="px-3 py-1.5 text-[11px] font-medium border border-borderPrimary text-body bg-surface2/50 hover:bg-surface3 cursor-pointer rounded-sm transition-all duration-200"
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
  )
}
