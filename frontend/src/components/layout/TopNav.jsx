import { Link, useLocation } from 'react-router-dom'
import { C } from '../../theme'
import { MACHINES } from '../../data/machines'

export function TopNav({ theme, onToggleTheme }) {
  const location = useLocation()
  const now = new Date().toLocaleTimeString('en-GB', { hour12: false })

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 52,
      borderBottom: `1px solid ${C.border}`,
      background: C.bgS1, flexShrink: 0,
    }}>
      {/* Brand */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.heading, letterSpacing: '-0.02em' }}>
          DRIFT<span style={{ color: C.warn }}>VEIL</span>
        </span>
        <span style={{ color: C.border }}>|</span>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.subtle }}>
          Industrial Drift Intelligence
        </span>
      </Link>

      {/* Nav Links */}
      <nav style={{ display: 'flex', height: 52 }}>
        {[
          { to: '/',         label: 'Plant Operator' },
          { to: '/engineer', label: 'Maintenance Engineer' },
        ].map(({ to, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              style={{
                padding: '0 20px',
                display: 'flex', alignItems: 'center',
                fontSize: 12, fontWeight: 500, textDecoration: 'none',
                borderBottom: active ? `2px solid ${C.warn}` : '2px solid transparent',
                color: active ? C.heading : C.subtle,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Status + Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.safe }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.safe }} />
          Monitoring {MACHINES.length} Active Nodes
        </span>
        <span style={{ color: C.border }}>|</span>
        <span style={{ color: C.subtle, fontFamily: 'JetBrains Mono' }}>SERVER CONNECTED</span>
        <span style={{ color: C.border }}>|</span>
        <span style={{ color: C.muted, fontFamily: 'JetBrains Mono' }}>{now}</span>
        <span style={{ color: C.border }}>|</span>
        <button
          onClick={onToggleTheme}
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 500,
            border: `1px solid ${C.border}`, color: C.body,
            background: C.bgS2, cursor: 'pointer', borderRadius: 2,
            transition: 'all 0.15s',
          }}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
  )
}
