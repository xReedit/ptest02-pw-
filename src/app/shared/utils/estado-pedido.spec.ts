import { resumirEstadoPedido, PASOS_ESTADO } from './estado-pedido';

describe('resumirEstadoPedido', () => {
  const casos: Array<[any, string, number]> = [
    [{ pwa_estado: 'P', pwa_delivery_status: '0' }, 'Recibido', 1],
    [{ pwa_estado: 'A', pwa_delivery_status: '0' }, 'En preparación', 3],
    [{ pwa_estado: 'D', pwa_delivery_status: '0' }, 'En preparación', 3],
    [{ pwa_estado: 'R', pwa_delivery_status: '0' }, 'Repartidor asignado', 4],
    [{ pwa_estado: 'A', pwa_delivery_status: 1 }, 'Repartidor asignado', 4],
    [{ pwa_estado: 'A', pwa_delivery_status: '3' }, 'En camino', 5],
    [{ pwa_estado: 'E', pwa_delivery_status: '3' }, 'Entregado', 6],
    [{ pwa_estado: 'A', pwa_delivery_status: 4 }, 'Entregado', 6],
    [{ pwa_estado: 'C', pwa_delivery_status: '0' }, 'Cancelado', 0],
    [{ pwa_estado: 'A', pwa_delivery_status: '5' }, 'Cancelado', 0],
    [{}, 'Recibido', 1],
  ];
  casos.forEach(([p, etiqueta, paso]) => {
    it(`${JSON.stringify(p)} → ${etiqueta}`, () => {
      const r = resumirEstadoPedido(p);
      expect(r.etiqueta).toBe(etiqueta);
      expect(r.paso).toBe(paso);
      expect(r.activo).toBe(paso > 0 && paso < 6);
    });
  });
  it('tiene 6 pasos ordenados', () => {
    expect(PASOS_ESTADO.map(x => x.etiqueta)).toEqual(['Recibido', 'Aceptado', 'En preparación', 'Repartidor asignado', 'En camino', 'Entregado']);
  });
});
