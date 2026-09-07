export default function Modal({ title, eyebrow, children, onClose, actions }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-accent" />
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">x</button>
        {eyebrow && <p className="modal-label">{eyebrow}</p>}
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </section>
    </div>
  )
}