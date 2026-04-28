import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { TopNav } from './components/layout/TopNav'
import { OperatorView }      from './views/OperatorView'
import { MachineDetailView } from './views/MachineDetailView'
import { ArchitectureView }  from './views/ArchitectureView'
import { FeaturesView }      from './views/FeaturesView'
import { AddMachineView }    from './views/AddMachineView'
import './index.css'

function AppShell({ theme, onToggleTheme }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex flex-col h-full bg-bgBase text-body" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TopNav theme={theme} onToggleTheme={onToggleTheme} />
      <main className="flex-1 overflow-auto bg-bgBase">
        <Routes>
          <Route path="/"                    element={<OperatorView />} />
          <Route path="/machine/:machineId"  element={<MachineDetailView />} />
          <Route path="/machines/new"        element={<AddMachineView />} />
          <Route path="/architecture"        element={<ArchitectureView />} />
          <Route path="/features"            element={<FeaturesView />} />
        </Routes>
      </main>
    </div>
  )
}

import { SensorFeedProvider } from './hooks/useSensorFeed'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <SensorFeedProvider>
      <BrowserRouter>
        <AppShell theme={theme} onToggleTheme={toggleTheme} />
      </BrowserRouter>
    </SensorFeedProvider>
  )
}
