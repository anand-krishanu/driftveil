import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { C } from './theme'
import { TopNav } from './components/layout/TopNav'
import { Footer } from './components/layout/Footer'
import { OperatorView }      from './views/OperatorView'
import { EngineerView }      from './views/EngineerView'
import { MachineDetailView } from './views/MachineDetailView'
import './index.css'

function Breadcrumb() {
  const location = useLocation()
  const label =
    location.pathname.startsWith('/machine') ? 'Machine Detail View' :
    location.pathname === '/engineer'         ? 'Maintenance Engineer View' :
    'Plant Operator View'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 24px', borderBottom: `1px solid ${C.border}`,
      background: C.bgBase, flexShrink: 0,
    }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>
        DriftVeil · {label} · Bottling Plant — Lines 1–4
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: C.muted }}>
        {['CUSUM Drift Detection', 'MCP Agent Pipeline', 'Amazon Bedrock', 'AWS Strands Agents'].map((tag, i) => (
          <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {i > 0 && <span style={{ color: C.border }}>·</span>}
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function AppShell({ theme, onToggleTheme }) {
  return (
    <div
      data-theme={theme}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: C.bgBase, color: C.body,
        fontFamily: 'Inter, system-ui, sans-serif',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      <TopNav theme={theme} onToggleTheme={onToggleTheme} />
      <Breadcrumb />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/"                    element={<OperatorView />} />
          <Route path="/engineer"            element={<EngineerView />} />
          <Route path="/machine/:machineId"  element={<MachineDetailView />} />
        </Routes>
      </main>
      <Footer />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState('dark')
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <BrowserRouter>
      <AppShell theme={theme} onToggleTheme={toggleTheme} />
    </BrowserRouter>
  )
}
