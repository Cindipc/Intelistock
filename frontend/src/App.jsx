import { useState } from 'react'
import './App.css'
import './accessible.css'
import Sidebar from './components/navigation/Sidebar'
import Topbar from './components/navigation/Topbar'
import DashboardPage from './pages/dashboard/DashboardPage'
import PredictionsPage from './pages/predictions/PredictionsPage'
import HistoricalPage from './pages/historical/HistoricalPage'
import CompaniesPage from './pages/companies/CompaniesPage'
import PreferencesPage from './pages/preferences/PreferencesPage'
import Modal from './components/ui/Modal'

function App() {
  const [activeView, setActiveView] = useState('Resumen')
  const [query, setQuery] = useState('')
  const [updated, setUpdated] = useState(false)
  const [modal, setModal] = useState(null)

  const handleRefresh = () => {
    setUpdated(true)
    setTimeout(() => setUpdated(false), 2000)
  }

  const renderView = () => {
    if (activeView === 'Predicciones') return <PredictionsPage onOpenModal={setModal} />
    if (activeView === 'Datos historicos') return <HistoricalPage />
    if (activeView === 'Empresas') return <CompaniesPage />
    if (activeView === 'Preferencias') return <PreferencesPage />
    return <DashboardPage query={query} onQueryChange={setQuery} onRefresh={handleRefresh} onOpenModal={setModal} updated={updated} />
  }

  return <div className="app-shell"><Sidebar activeView={activeView} onNavigate={setActiveView} /><main className="main-content"><Topbar activeView={activeView} query={query} onQueryChange={setQuery} onOpenModal={setModal} />{renderView()}</main>{modal && <Modal {...modal} onClose={() => setModal(null)} />}</div>
}

export default App
