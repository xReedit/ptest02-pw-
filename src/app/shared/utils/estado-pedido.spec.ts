import { resumirEstadoPedido, PASOS_ESTADO } from './estado-pedido';

describe('resumirEstadoPedido', () => {
  const casos: Array<[any, string, number]> = [
    [{ pwa_estado: 'P', pwa_delivery_status: '0' }, 'Recibido', 1],
    [{ pwa_estado: 'A', pwa_delivery_status: '0' }, 'En preparación', 2],
    [{ pwa_estado: 'D', pwa_delivery_status: '0' }, 'En preparación', 2],
    [{ pwa_estado: 'R', pwa_delivery_status: '0' }, 'Repartidor asignado', 3],
    [{ pwa_estado: 'A', pwa_delivery_status: 1 }, 'Repartidor asignado', 3],
    [{ pwa_estado: 'A', pwa_delivery_status: '3' }, 'En camino', 4],
    [{ pwa_estado: 'E', pwa_delivery_status: '3' }, 'Entregado', 5],
    [{ pwa_estado: 'A', pwa_delivery_status: 4 }, 'Entregado', 5],
    [{ pwa_estado: 'C', pwa_delivery_status: '0' }, 'Cancelado', 0],
    [{ pwa_estado: 'A', pwa_delivery_status: '5' }, 'Cancelado', 0],
    [{}, 'Recibido', 1],
  ];
  casos.forEach(([p, etiqueta, paso]) => {
    it(`${JSON.stringify(p)} → ${etiqueta}`, () => {
      const r = resumirEstadoPedido(p);
      expect(r.etiqueta).toBe(etiqueta);
      expect(r.paso).toBe(paso);
      expect(r.activo).toBe(paso > 0 && paso < 5);
    });
  });

  it('el comercio "A" (aceptado) reporta "En preparación" en el paso 2, no un paso "aceptado" aparte', () => {
    const r = resumirEstadoPedido({ pwa_estado: 'A', pwa_delivery_status: '0' });
    expect(r.codigo).toBe('preparando');
    expect(r.etiqueta).toBe('En preparación');
    expect(r.paso).toBe(2);
  });

  it('tiene 5 pasos ordenados, sin el paso "Aceptado"', () => {
    expect(PASOS_ESTADO.map(x => x.etiqueta)).toEqual(['Recibido', 'En preparación', 'Repartidor asignado', 'En camino', 'Entregado']);
  });
});
