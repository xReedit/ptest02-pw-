// Regla de costo de entrega de la tienda en linea. Funcion pura: sin Angular, sin google,
// para poder probarla sola (ver calc-distancia.costo.spec.ts). El servicio solo la envuelve.
// parametros = sede_costo_delivery.parametros que entrega EstablecimientoService.getParametrosTiendaLinea()

export interface ParametrosCostoDelivery {
  modo?: 'fijo' | 'variable' | 'zonas';
  km_base?: number | string;
  km_base_costo?: number | string;
  km_adicional_costo?: number | string;
  km_limite?: number | string;
  costo_fijo?: number | string;
  // la base guarda unas sedes con un entero de minutos (13 -> 15) y otras con un texto ('30 - 45 min')
  tiempo_aprox_entrega?: number | string;
}

// 'sin-reglas' = la sede no tiene configurado el costo de entrega (falta de configuracion del
// comercio). 'fuera-de-cobertura' = la direccion esta mas lejos del radio maximo. Quien llama
// necesita distinguirlos: con 'sin-reglas' la direccion del cliente sigue siendo valida.
export type MotivoSinCosto = 'sin-reglas' | 'fuera-de-cobertura';

export interface CostoEntrega {
  success: boolean;
  costo_servicio?: number;
  distancia_en_km?: string;
  tiempo_aprox_entrega?: number | string;
  mensaje?: string;
  motivo?: MotivoSinCosto;
}

export const MSJ_FUERA_DE_COBERTURA = 'Lo siento, el servicio no está disponible en esta zona. Verifica que la dirección sea la correcta. También puedes adjuntarnos tu ubicación.';

// el backend devuelve los numeros unas veces como number y otras como cadena
const aNumero = (valor: any): number => typeof valor === 'string' ? parseFloat(valor) : valor;

// texto listo para pintar del tiempo de entrega: la sede lo puede tener como minutos (15) o como
// texto ya redactado ('30 - 45 min'); solo al numero hay que ponerle la unidad
export function formatearTiempoEntrega(valor?: number | string): string {
  if (valor === null || valor === undefined || valor === '') { return ''; }
  const enTexto = valor.toString().trim();
  if (enTexto === '') { return ''; }
  const minutos = Number(enTexto);
  return Number.isFinite(minutos) ? `${minutos} min` : enTexto;
}

// redondear = UtilitariosService.roundAmount, inyectado para no arrastrar Angular al test
export function calcularCostoEntrega(
  parametros: ParametrosCostoDelivery,
  distanciaEnKm: number,
  redondear: (monto: number) => number
): CostoEntrega {
  const _parametros = parametros || {};
  const distancia = distanciaEnKm.toFixed(2);
  const tiempo = _parametros.tiempo_aprox_entrega
    ? { tiempo_aprox_entrega: _parametros.tiempo_aprox_entrega }
    : {};

  // modo 'fijo': el costo no depende de la distancia, tampoco del radio maximo
  if (_parametros.modo === 'fijo') {
    const costoFijo = aNumero(_parametros.costo_fijo);

    // sede en modo fijo sin costo_fijo: antes se cobraba 0 en silencio, que es peor que avisar
    if (!Number.isFinite(costoFijo)) {
      return { mensaje: MSJ_FUERA_DE_COBERTURA, success: false, motivo: 'sin-reglas' };
    }

    return {
      ...tiempo,
      distancia_en_km: distancia,
      costo_servicio: redondear(costoFijo),
      success: true
    };
  }

  // ponytail: modo 'zonas' (poligonos/circulos de parametros.zonas) llega en el sprint de "Mi tienda";
  // hasta entonces cae aqui y se cobra por distancia, que es lo que ya hacia antes.
  // sin 'modo' declarado se comporta como 'variable': compatibilidad con las sedes ya configuradas.
  const radioBasico = aNumero(_parametros.km_base);
  const costoBasico = aNumero(_parametros.km_base_costo);
  const costoAdicionalPorKilometro = aNumero(_parametros.km_adicional_costo);
  const radioMaximo = aNumero(_parametros.km_limite);

  // sede sin la regla de costo configurada: mejor avisar que dejar que el NaN se cuele al pedido
  if (!Number.isFinite(radioMaximo) || !Number.isFinite(costoBasico)) {
    return { mensaje: MSJ_FUERA_DE_COBERTURA, success: false, motivo: 'sin-reglas' };
  }

  if (distanciaEnKm > radioMaximo) {
    return { mensaje: MSJ_FUERA_DE_COBERTURA, success: false, motivo: 'fuera-de-cobertura' };
  }

  const distanciaAdicional = distanciaEnKm - radioBasico;
  const costoSinRedondear = distanciaAdicional > 0
    ? costoBasico + (distanciaAdicional * costoAdicionalPorKilometro)
    : costoBasico;

  return {
    ...tiempo,
    distancia_en_km: distancia,
    costo_servicio: redondear(costoSinRedondear),
    success: true
  };
}
