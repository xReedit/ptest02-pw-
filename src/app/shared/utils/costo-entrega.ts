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
  tiempo_aprox_entrega?: string;
}

export interface CostoEntrega {
  success: boolean;
  costo_servicio?: number;
  distancia_en_km?: string;
  tiempo_aprox_entrega?: string;
  mensaje?: string;
}

export const MSJ_FUERA_DE_COBERTURA = 'Lo siento, el servicio no está disponible en esta zona. Verifica que la dirección sea la correcta. También puedes adjuntarnos tu ubicación.';

// el backend devuelve los numeros unas veces como number y otras como cadena
const aNumero = (valor: any): number => typeof valor === 'string' ? parseFloat(valor) : valor;

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
    return {
      ...tiempo,
      distancia_en_km: distancia,
      costo_servicio: redondear(aNumero(_parametros.costo_fijo) || 0),
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

  if (distanciaEnKm > radioMaximo) {
    return { mensaje: MSJ_FUERA_DE_COBERTURA, success: false };
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
