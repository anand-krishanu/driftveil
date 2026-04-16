import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { Footer } from './components/layout/Footer'
import { OperatorView }      from './views/OperatorView'
import { EngineerView }      from './views/EngineerView'
import { MachineDetailView } from './views/MachineDetailView'
import { ArchitectureView }  from './views/ArchitectureView'
import { FeaturesView }      from './views/FeaturesView'
import './index.css'

function Breadcrumb() {
  const location = useLocation()
  const label =
    location.pathname.startsWith('/machine') ? 'Machine Detail View' :
    location.pathname === '/engineer'         ? 'Maintenance Engineer View' :
    location.pathname === '/architecture'     ? 'Backend Architecture' :
    location.pathname === '/features'         ? 'Why DriftVeil — Competitive Analysis' :
    'Plant Operator View'

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-borderPrimary bg-bgBase shrink-0 shadow-sm z-10">
      <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted">
        DriftVeil <span className="mx-1 text-borderPrimary">·</span> {label} <span className="mx-1 text-borderPrimary">·</span> Bottling Plant — Lines 1–4
      </p>
      <div className="flex items-center gap-3 text-[10px] text-muted font-medium tracking-wide">
        {['CUSUM Drift Detection', 'MCP Agent Pipeline', 'Amazon Bedrock', 'AWS Strands Agents'].map((tag, i) => (
          <span key={tag} className="flex items-center gap-3">
            {i > 0 && <span className="text-borderPrimary/50">·</span>}
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
      className="flex flex-col h-full bg-bgBase text-body font-sans transition-colors duration-200"
    >
      <TopNav theme={theme} onToggleTheme={onToggleTheme} />
      <Breadcrumb />
      <main className="flex-1 overflow-auto bg-bgBase selection:bg-warn/20 selection:text-warn">
        <Routes>
          <Route path="/"                    element={<OperatorView />} />
          <Route path="/engineer"            element={<EngineerView />} />
          <Route path="/machine/:machineId"  element={<MachineDetailView />} />
          <Route path="/architecture"        element={<ArchitectureView />} />
          <Route path="/features"            element={<FeaturesView />} />
        </Routes>
      </main>
      <Footer />
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
