const paths = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  trend: 'M4 16l5-5 3 3 7-8M15 6h4v4',
  database: 'M4 6c0-2 16-2 16 0v12c0 2-16 2-16 0V6zm0 0c0 2 16 2 16 0M4 12c0 2 16 2 16 0',
  building: 'M5 20V6l7-3 7 3v14M3 20h18M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8 4l-2-1 .1-2.1-2-1.1-1.6 1.3A7.5 7.5 0 0013 8l-.4-2.1h-2.2L10 8a7.5 7.5 0 00-1.5 1.1L6.9 7.8l-2 1.1L5 11l-2 1v2l2 1-.1 2.1 2 1.1 1.6-1.3A7.5 7.5 0 0011 16l.4 2.1h2.2L14 16a7.5 7.5 0 001.5-1.1l1.6 1.3 2-1.1L19 14l1-1v-2z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zm5-2l4 4',
  bell: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
}

export default function Icon({ name }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
