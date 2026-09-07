export default function KpiCard({ label, value, detail, tone = '', children, progress }) {
  return (
    <article className={`dashboard-kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      {progress !== undefined && <div className="kpi-progress" aria-label={`${progress}% de inventario saludable`}><i style={{ width: `${progress}%` }} /></div>}
      {children}
    </article>
  )
}
