// Utilidades geograficas sin dependencias: se usan cuando la API de Google no responde.

export interface CoordGeo {
  lat: number;
  lng: number;
}

const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

// Distancia en linea recta (formula del haversine) entre dos coordenadas, en kilometros.
export function distanciaKmHaversine(a: CoordGeo, b: CoordGeo): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const senoLat = Math.sin(dLat / 2);
  const senoLng = Math.sin(dLng / 2);

  const h = (senoLat * senoLat) +
    (Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * senoLng * senoLng);

  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
