import { distanciaKmHaversine } from './geo';

describe('distanciaKmHaversine', () => {
  // plaza de armas de Moyobamba
  const plaza = { lat: -6.0342, lng: -76.9717 };

  it('devuelve 0 para el mismo punto', () => {
    expect(distanciaKmHaversine(plaza, plaza)).toBe(0);
  });

  it('mide ~1.11 km para 0.01 grados al este', () => {
    const km = distanciaKmHaversine(plaza, { lat: plaza.lat, lng: plaza.lng + 0.01 });
    expect(km).toBeGreaterThan(1.11 * 0.95);
    expect(km).toBeLessThan(1.11 * 1.05);
  });

  it('es simetrica', () => {
    const destino = { lat: -6.05, lng: -76.99 };
    expect(distanciaKmHaversine(plaza, destino)).toBeCloseTo(distanciaKmHaversine(destino, plaza), 6);
  });
});
