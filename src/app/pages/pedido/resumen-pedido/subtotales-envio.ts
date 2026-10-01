import { b64DecodeUnicode } from 'src/app/shared/utils/b64';

// Subtotales que viajan con el pedido (p_subtotales: se guardan, se imprimen, el POS los muestra como consumo
// y en holding son el importe que se cobra con Niubiz).
//
// sys::st (localStorage) trae lo que el usuario armo en pantalla: servicios opcionales, propina, recojo en local,
// costo de entrega. Pero localStorage es uno solo para todas las pestanas: con la app abierta en dos pestanas,
// la otra pisa sys::st y el pedido sale con el total ajeno (caso real 30/09: carrito de 19.00 enviado con 44.00).
//
// Regla: se usa sys::st solo si su SUB TOTAL corresponde al carrito que se envia (recalculado con las mismas
// reglas). Si no, el de esta pestana (en memoria) y, si tampoco cuadra, el recalculado.

const TOLERANCIA = 0.02; // redondeos del I.G.V. (toFixed en cada paso)

export type Subtotales = Array<{ descripcion?: string; importe?: string | number; [k: string]: any }>;

export function importeSubTotal(arr: Subtotales | null | undefined): number | null {
  if (!Array.isArray(arr)) { return null; }
  const fila = arr.find(x => x && x.descripcion === 'SUB TOTAL');
  const importe = fila ? parseFloat(String(fila.importe)) : NaN;
  return Number.isFinite(importe) ? importe : null;
}

export function elegirSubtotalesEnvio(
  guardado: Subtotales | null,
  enMemoria: Subtotales | null,
  recalculado: Subtotales | null,
): Subtotales | null {
  const esperado = importeSubTotal(recalculado);
  // sin recalculo posible (reglas aun no cargadas) se mantiene el comportamiento anterior
  if (esperado === null) { return guardado || enMemoria; }

  const cuadra = (arr: Subtotales | null) => {
    const sub = importeSubTotal(arr);
    return sub !== null && Math.abs(sub - esperado) <= TOLERANCIA;
  };

  if (cuadra(guardado)) { return guardado; }
  if (cuadra(enMemoria)) { return enMemoria; }
  return recalculado;
}

// sys::st se guarda con b64EncodeUnicode(JSON); null si no hay o esta corrupto
export function leerSubtotalesGuardados(raw: string | null): Subtotales | null {
  if (!raw) { return null; }
  try {
    const arr = JSON.parse(b64DecodeUnicode(raw));
    return Array.isArray(arr) ? arr : null;
  } catch (e) {
    return null;
  }
}
