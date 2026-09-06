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

      <section className="workspace-table" style={{ marginTop: 24 }}>
        <div className="table-header">
          <div>
            <p className="panel-kicker">CONFIGURACION</p>
            <h2>Ajustes activos</h2>
          </div>
        </div>
        {[
          { label: 'Notificaciones por correo', valor: 'Alertas de stock critico y reorden activadas', estado: 'Activa', tono: 'good' },
          { label: 'Reportes automaticos', valor: 'Resumen semanal los lunes a las 8:00', estado: 'Activa', tono: 'good' },
          { label: 'Modo oscuro', valor: 'En desarrollo', estado: 'Proximamente', tono: '' },
          { label: 'Exportacion de datos', valor: 'CSV y PDF habilitados', estado: 'Activa', tono: 'good' },
          { label: 'Sucursal por defecto', valor: 'SUC-001 · Centro, Ciudad de Mexico', estado: 'Configurada', tono: 'good' },
          { label: 'Horizonte de prediccion', valor: '15 dias', estado: 'Activa', tono: 'good' },
        ].map((item, index) => (
          <div className="workspace-row" key={item.label}>
            <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.label}</strong>
            <span>{item.valor}</span>
            <b className={`row-status ${item.tono}`}>{item.estado}</b>
          </div>
        ))}
      </section>
    </div>
  )
}
