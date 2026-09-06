import { useState } from 'react'

export default function PreferencesPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-content workspace-page">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">CONFIGURACION</p>
          <h1>Preferencias</h1>
          <p className="subtitle">Ajusta el espacio de trabajo y la forma en que recibes informacion.</p>
        </div>
        <button className="refresh-button" onClick={handleSave}>{saved ? 'Guardado!' : 'Guardar cambios'} <span>{saved ? '✓' : '+'}</span></button>
      </div>

      <section className="workspace-cards">
        <article className="workspace-card"><span>ALERTAS ACTIVAS</span><strong>7</strong><small>Notificaciones configuradas</small></article>
        <article className="workspace-card"><span>FUENTES CONECTADAS</span><strong>6</strong><small>Sincronizacion automatica</small></article>
        <article className="workspace-card"><span>USUARIOS CON ACCESO</span><strong>4</strong><small>1 administrador</small></article>
      </section>

      <section className="catalog-table">
        <div className="catalog-table-head">
          <span>CONFIGURACION</span>
          <span>VALOR</span>
          <span>ESTADO</span>
        </div>
        <div className="catalog-row">
          <code>Notificaciones por correo</code>
          <span><strong>Alertas de stock critico y reorden activadas</strong></span>
          <span className="risk-badge risk-saludable">Activa</span>
        </div>
        <div className="catalog-row">
          <code>Reportes automaticos</code>
          <span><strong>Resumen semanal los lunes a las 8:00</strong></span>
          <span className="risk-badge risk-saludable">Activa</span>
        </div>
        <div className="catalog-row">
          <code>Modo oscuro</code>
          <span><strong>En desarrollo</strong></span>
          <span className="risk-badge risk-bajo">Proximamente</span>
        </div>
        <div className="catalog-row">
          <code>Exportacion de datos</code>
          <span><strong>CSV y PDF habilitados</strong></span>
          <span className="risk-badge risk-saludable">Activa</span>
        </div>
        <div className="catalog-row">
          <code>Sucursal por defecto</code>
          <span><strong>SUC-001 · Centro, Ciudad de Mexico</strong></span>
          <span className="risk-badge risk-saludable">Configurada</span>
        </div>
        <div className="catalog-row">
          <code>Horizonte de prediccion</code>
          <span><strong>15 dias</strong></span>
          <span className="risk-badge risk-saludable">Activa</span>
        </div>
      </section>
    </div>
  )
}
