export type EstadoCodigo = 'recibido' | 'preparando' | 'asignado' | 'camino' | 'entregado' | 'cancelado';
export interface EstadoResumen { codigo: EstadoCodigo; etiqueta: string; paso: number; activo: boolean; }

// 'aceptado' (pwa_estado 'A') y 'preparando' (pwa_estado 'D') son un solo paso visible:
// el comercio pasa directo de "recibido" a "en preparación", nunca se vio "aceptado" en producción.
export const PASOS_ESTADO: { codigo: EstadoCodigo; etiqueta: string }[] = [
  { codigo: 'recibido', etiqueta: 'Recibido' },
  { codigo: 'preparando', etiqueta: 'En preparación' },
  { codigo: 'asignado', etiqueta: 'Repartidor asignado' },
  { codigo: 'camino', etiqueta: 'En camino' },
  { codigo: 'entregado', etiqueta: 'Entregado' },
];

function porCodigo(codigo: EstadoCodigo): EstadoResumen {
  if (codigo === 'cancelado') { return { codigo, etiqueta: 'Cancelado', paso: 0, activo: false }; }
  const paso = PASOS_ESTADO.findIndex(x => x.codigo === codigo) + 1;
  return { codigo, etiqueta: PASOS_ESTADO[paso - 1].etiqueta, paso, activo: paso < PASOS_ESTADO.length };
}

// pwa_estado: etapa del local (P A D R E C). pwa_delivery_status: etapa del repartidor (0 1 3 4 5).
export function resumirEstadoPedido(p: { pwa_estado?: string; pwa_delivery_status?: string | number }): EstadoResumen {
  const local = String(p?.pwa_estado || 'P').toUpperCase();
  const reparto = String(p?.pwa_delivery_status ?? '0');
  if (local === 'C' || reparto === '5') { return porCodigo('cancelado'); }
  if (local === 'E' || reparto === '4') { return porCodigo('entregado'); }
  if (reparto === '3') { return porCodigo('camino'); }
  if (reparto === '1' || local === 'R') { return porCodigo('asignado'); }
  if (local === 'A' || local === 'D') { return porCodigo('preparando'); }
  return porCodigo('recibido');
}
