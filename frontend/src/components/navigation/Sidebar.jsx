import Icon from '../ui/Icon'
import { navigation } from '../../data/dashboardData'

export default function Sidebar({ activeView, onNavigate }) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">i</span><span>intelistock</span></div>
    <div className="workspace-switcher"><span className="workspace-avatar">A</span><span><strong>Alimentos del Valle</strong><small>Espacio de trabajo</small></span><span className="chevron">⌄</span></div>
    <nav aria-label="Navegación principal">
      <p className="nav-label">GESTIÓN</p>
      {navigation.map((item) => <button className={`nav-item ${activeView === item.label ? 'active' : ''}`} key={item.label} onClick={() => onNavigate(item.label)}><Icon name={item.icon} /><span>{item.label}</span>{item.badge && <span className="nav-badge">{item.badge}</span>}</button>)}
      <p className="nav-label nav-label-spaced">CONFIGURACIÓN</p>
      <button className={`nav-item ${activeView === 'Preferencias' ? 'active' : ''}`} onClick={() => onNavigate('Preferencias')}><Icon name="settings" /><span>Preferencias</span></button>
    </nav>
    <div className="sidebar-bottom"><div className="help-card"><span className="help-dot">?</span><span><strong>¿Necesitas ayuda?</strong><small>Visita nuestro centro de ayuda</small></span><Icon name="arrow" /></div><div className="user-row"><span className="user-avatar">MR</span><span><strong>María Rodríguez</strong><small>Administradora</small></span><button className="more-button" aria-label="Más opciones">•••</button></div></div>
  </aside>
}
