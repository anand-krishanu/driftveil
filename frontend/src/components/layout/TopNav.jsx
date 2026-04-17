import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMachines } from '../../hooks/useMachines'

const NAV_LINKS = [
  { to: '/',             label: 'Plant Operator',       icon: '⬡' },
  { to: '/engineer',     label: 'Engineer View',         icon: '⚙' },
  { to: '/machines/new', label: 'Add Machine',           icon: '+' },
  { to: '/architecture', label: 'Architecture',          icon: '◈' },
  { to: '/features',     label: 'Why DriftVeil',         icon: '✦' },
]

export function TopNav({ theme, onToggleTheme }) {
  const location = useLocation()
  const { machines } = useMachines()
  const [now, setNow] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }))
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000)
    return () => clearInterval(t)
  }, [])

  const driftCount = machines.filter(m => m.status === 'DRIFT').length
  const warnCount  = machines.filter(m => m.status === 'WARN').length

  return (
    <header
      className="flex items-center shrink-0 border-b"
      style={{
        height: 40,
        background: 'var(--bg-header)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2 px-4 shrink-0 border-r h-full"
        style={{ borderColor: 'var(--border)', minWidth: 160 }}
      >
        <span style={{ color: 'var(--accent-info)', fontSize: 14 }}>◈</span>
        <span style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>
          DRIFT<span style={{ color: 'var(--accent-warn)' }}>VEIL</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center h-full">
        {NAV_LINKS.map(({ to, label, icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 px-4 h-full no-underline border-b-2 transition-colors duration-150 text-[12px] font-medium"
              style={{
                borderBottomColor: active ? 'var(--accent-info)' : 'transparent',
                color: active ? 'var(--text-heading)' : 'var(--text-subtle)',
                background: active ? 'rgba(87,148,242,0.06)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.7 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status pills */}
      <div className="flex items-center gap-1 px-3">
        {driftCount > 0 && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold tracking-wide"
            style={{
              background: 'var(--accent-critical-dim)',
              color: 'var(--accent-critical)',
              border: '1px solid var(--accent-critical)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: 'var(--accent-critical)' }} />
            {driftCount} DRIFT
          </span>
        )}
        {warnCount > 0 && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold tracking-wide"
            style={{
              background: 'var(--accent-warn-dim)',
              color: 'var(--accent-warn)',
              border: '1px solid rgba(255,153,0,0.4)',
            }}
          >
            {warnCount} WARN
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 mx-2" style={{ background: 'var(--border)' }} />

      {/* Connected */}
      <div className="flex items-center gap-1.5 px-3 text-[11px]" style={{ color: 'var(--accent-safe)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-safe)' }} />
        <span style={{ fontFamily: 'JetBrains Mono' }}>WS CONNECTED</span>
      </div>

      {/* Clock */}
      <div
        className="px-3 text-[11px] border-l"
        style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-subtle)', borderColor: 'var(--border)' }}
      >
        {dateStr} &nbsp;{now}
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        className="px-3 h-full text-[11px] border-l transition-colors cursor-pointer"
        style={{
          background: 'transparent',
          border: 'none',
          borderLeft: '1px solid var(--border)',
          color: 'var(--text-subtle)',
          cursor: 'pointer',
        }}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </header>
  )
}
