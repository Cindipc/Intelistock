export const companies = [
  { name: 'Mercado Norte', sector: 'Alimentos y bebidas', initials: 'MN', tone: 'coral', status: 'En seguimiento', trend: '+12.4%' },
  { name: 'Casa Raiz', sector: 'Hogar y decoracion', initials: 'CR', tone: 'yellow', status: 'Revision sugerida', trend: '+8.1%' },
  { name: 'Taller 17', sector: 'Manufactura ligera', initials: 'T17', tone: 'blue', status: 'Datos actualizados', trend: '+4.7%' },
]

export const chartData = [
  { month: 'Ene', value: 48, forecast: false }, { month: 'Feb', value: 55, forecast: false },
  { month: 'Mar', value: 51, forecast: false }, { month: 'Abr', value: 68, forecast: false },
  { month: 'May', value: 63, forecast: false }, { month: 'Jun', value: 76, forecast: false },
  { month: 'Jul', value: 72, forecast: true }, { month: 'Ago', value: 84, forecast: true },
  { month: 'Sep', value: 88, forecast: true },
]

export const navigation = [
  { label: 'Resumen', icon: 'grid' },
  { label: 'Predicciones', icon: 'trend', badge: '3' },
  { label: 'Datos historicos', icon: 'database' },
  { label: 'Empresas', icon: 'building' },
]

export const inventoryProducts = [
  { id: 'cafe-250', backendId: 1, name: 'Cafe molido 250 g', sku: 'CAF-250-ORG', category: 'Alimentos', supplier: 'Sierra Verde', avatar: 'CM', tone: 'coral', available: 18, reserved: 12, transit: 24, minimum: 36, sold30: 154, demand7: 42, demand15: 91, demand30: 182, coverage: 4, reorderPoint: 48, rotation: 'Alta', trend: '+18%', breakDate: '9 sep', risk: 'Critico', action: 'Crear orden de compra', price: 8.5, value: 4590, leadTime: '5 dias', reason: 'La demanda semanal crecio 18% y el stock util no cubre 7 dias.' },
  { id: 'botella-750', backendId: 2, name: 'Botella termica 750 ml', sku: 'HOG-BOT-750', category: 'Hogar', supplier: 'Nexo Supply', avatar: 'BT', tone: 'blue', available: 64, reserved: 18, transit: 0, minimum: 50, sold30: 106, demand7: 28, demand15: 59, demand30: 112, coverage: 16, reorderPoint: 55, rotation: 'Media', trend: '+6%', breakDate: '25 sep', risk: 'Bajo', action: 'Programar reposicion', price: 14, value: 8960, leadTime: '8 dias', reason: 'El inventario se acerca al punto de reorden en dos semanas.' },
  { id: 'kit-cuidado', backendId: 3, name: 'Kit cuidado facial', sku: 'BEL-KIT-04', category: 'Belleza', supplier: 'Luma Labs', avatar: 'KF', tone: 'yellow', available: 142, reserved: 21, transit: 60, minimum: 45, sold30: 80, demand7: 19, demand15: 41, demand30: 77, coverage: 52, reorderPoint: 62, rotation: 'Baja', trend: '-4%', breakDate: '28 oct', risk: 'Sobrestock', action: 'Reducir siguiente compra', price: 22, value: 31240, leadTime: '12 dias', reason: 'Hay 52 dias de cobertura y la rotacion bajo 4% este mes.' },
  { id: 'libreta-a5', backendId: 4, name: 'Libreta premium A5', sku: 'PAP-A5-PRM', category: 'Papeleria', supplier: 'Papel Norte', avatar: 'LP', tone: 'green', available: 88, reserved: 9, transit: 40, minimum: 30, sold30: 64, demand7: 16, demand15: 34, demand30: 68, coverage: 39, reorderPoint: 38, rotation: 'Media', trend: '+3%', breakDate: '14 oct', risk: 'Saludable', action: 'Mantener seguimiento', price: 6.8, value: 5984, leadTime: '6 dias', reason: 'La cobertura supera el minimo y la demanda se mantiene estable.' },
]

export const inventoryAlerts = [
  { id: 1, level: 'Criticas', type: 'Riesgo de quiebre', product: 'Cafe molido 250 g', age: 'Hace 18 min', impact: '$1,547', cause: 'Stock util por debajo de la demanda de 7 dias', recommendation: 'Comprar 96 unidades hoy', critical: true },
  { id: 2, level: 'Requieren atencion', type: 'Punto de reorden', product: 'Botella termica 750 ml', age: 'Hace 2 h', impact: '$784', cause: 'Cobertura de 16 dias con lead time de 8 dias', recommendation: 'Programar compra de 40 unidades' },
  { id: 3, level: 'Informativas', type: 'Baja rotacion', product: 'Kit cuidado facial', age: 'Ayer', impact: '$3,240', cause: 'Rotacion 4% menor en los ultimos 30 dias', recommendation: 'Reducir proxima orden y activar promocion' },
]

export const branches = [
  { id: 'SUC-001', name: 'Centro', city: 'Ciudad de Mexico', products: 128, stockValue: '$50,774', demand: '439 u.', status: 'Operativa' },
  { id: 'SUC-002', name: 'Norte', city: 'Monterrey', products: 86, stockValue: '$31,420', demand: '286 u.', status: 'Operativa' },
  { id: 'SUC-003', name: 'Sur', city: 'Puebla', products: 64, stockValue: '$18,905', demand: '174 u.', status: 'Revision' },
]
