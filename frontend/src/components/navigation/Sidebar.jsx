import Icon from '../ui/Icon'
import { navigation } from '../../data/dashboardData'
import logo from '../../assets/InteliStock.jpeg'

export default function Sidebar({ activeView, onNavigate, open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img src={logo} alt="" className="brand-mark" />
          <span>inteli<em>stock</em></span>
        </div>
        <button className="workspace-switcher" onClick={onClose}>
          <span className="workspace-avatar">A</span>
          <span><strong>Alimentos del Valle</strong><small>Espacio de trabajo</small></span>
          <span className="chevron">⌄</span>
        </button>
        <nav aria-label="Navegación principal">
          <p className="nav-label">Gestión</p>
          {navigation.map((item) => (
            <button className={`nav-item ${activeView === item.label ? 'active' : ''}`} key={item.label} onClick={() => onNavigate(item.label)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
          <p className="nav-label nav-label-spaced">Configuración</p>
          <button className={`nav-item ${activeView === 'Preferencias' ? 'active' : ''}`} onClick={() => onNavigate('Preferencias')}>
            <Icon name="settings" />
            <span>Preferencias</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-dot">?</span>
            <span><strong>¿Necesitas ayuda?</strong><small>Visita nuestro centro de ayuda</small></span>
            <Icon name="arrow" />
          </div>
          <div className="user-row">
            <span className="user-avatar">MR</span>
            <span><strong>María Rodríguez</strong><small>Administradora</small></span>
            <button className="more-button" aria-label="Más opciones">•••</button>
          </div>
        </div>
      </aside>
    </>
  )
}