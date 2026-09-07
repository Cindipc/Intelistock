import { useState } from 'react'
import './App.css'
import Sidebar from './components/navigation/Sidebar'
import Topbar from './components/navigation/Topbar'
import DashboardPage from './pages/dashboard/DashboardPage'
import PredictionsPage from './pages/predictions/PredictionsPage'
import HistoricalPage from './pages/historical/HistoricalPage'
import BusinessPage from './pages/business/BusinessPage'
import PreferencesPage from './pages/preferences/PreferencesPage'
import Modal from './components/ui/Modal'

function App() {
  const [activeView, setActiveView] = useState('Resumen')
  const [query, setQuery] = useState('')
  const [updated, setUpdated] = useState(false)
  const [modal, setModal] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleRefresh = () => {
    setUpdated(true)
    setTimeout(() => setUpdated(false), 2000)
  }

  const navigate = (view) => {
    setActiveView(view)
    setMenuOpen(false)
  }

  const openModal = (content) => {
    setModal(content)
    if (content) setMenuOpen(false)
  }

  const renderView = () => {
    if (activeView === 'Predicciones') return <PredictionsPage onOpenModal={openModal} />
    if (activeView === 'Datos historicos') return <HistoricalPage />
    if (activeView === 'Mi Negocio') return <BusinessPage />
    if (activeView === 'Preferencias') return <PreferencesPage />
    return <DashboardPage query={query} onQueryChange={setQuery} onRefresh={handleRefresh} onOpenModal={openModal} updated={updated} />
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="main-content">
        <Topbar activeView={activeView} query={query} onQueryChange={setQuery} onOpenModal={openModal} onMenuClick={() => setMenuOpen(true)} />
        {renderView()}
      </main>
      {modal && <Modal {...modal} onClose={() => openModal(null)} />}
    </div>
  )
}

export default App
