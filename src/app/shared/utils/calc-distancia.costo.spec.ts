import { calcularCostoEntrega } from './costo-entrega';

// misma regla que UtilitariosService.roundAmount: baja a entero si el decimal es < 0.50, si no sube a .50
const redondear = (monto: number): number => {
  const entero = Math.floor(monto);
  return (monto - entero) < 0.50 ? entero : entero + 0.50;
};

describe('calcularCostoEntrega', () => {
  const parametrosVariable = {
    modo: 'variable' as const,
    km_base: 2,
    km_base_costo: 5,
    km_adicional_costo: 2,
    km_limite: 10,
    costo_fijo: 99
  };

  it('modo fijo: devuelve costo_fijo sin mirar la distancia', () => {
    const parametros = { ...parametrosVariable, modo: 'fijo' as const, costo_fijo: 7.5 };

    const cerca = calcularCostoEntrega(parametros, 0.4, redondear);
    const lejos = calcularCostoEntrega(parametros, 30, redondear);

    expect(cerca.success).toBe(true);
    expect(cerca.costo_servicio).toBe(7.5);
    expect(lejos.success).toBe(true);
    expect(lejos.costo_servicio).toBe(7.5);
    expect(lejos.distancia_en_km).toBe('30.00');
  });

  it('modo fijo acepta el costo como cadena', () => {
    const parametros = { ...parametrosVariable, modo: 'fijo' as const, costo_fijo: '6' };
    const rpt = calcularCostoEntrega(parametros, 3, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(6);
  });

  it('modo variable dentro del radio basico: cobra el costo basico', () => {
    const rpt = calcularCostoEntrega(parametrosVariable, 1.2, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(5);
    expect(rpt.distancia_en_km).toBe('1.20');
  });

  it('modo variable pasado el radio basico: suma el costo por km adicional y redondea', () => {
    // 5 + (4.5 - 2) * 2 = 10
    const rpt = calcularCostoEntrega(parametrosVariable, 4.5, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(10);
  });

  it('modo variable con parametros en cadena: mismo resultado', () => {
    const enCadena = { modo: 'variable' as const, km_base: '2', km_base_costo: '5', km_adicional_costo: '2', km_limite: '10', costo_fijo: 0 };
    const rpt = calcularCostoEntrega(enCadena, 4.5, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(10);
  });

  it('fuera del radio maximo: success false con mensaje para el usuario', () => {
    const rpt = calcularCostoEntrega(parametrosVariable, 12, redondear);
    expect(rpt.success).toBe(false);
    expect(rpt.mensaje).toBeTruthy();
    expect(rpt.costo_servicio).toBeUndefined();
  });

  it('sin modo declarado se comporta como variable y arrastra el tiempo aproximado', () => {
    const sinModo = { km_base: 2, km_base_costo: 5, km_adicional_costo: 2, km_limite: 10, costo_fijo: 99, tiempo_aprox_entrega: '30 - 45 min' };
    const rpt = calcularCostoEntrega(sinModo, 1, redondear);
    expect(rpt.success).toBe(true);
    expect(rpt.costo_servicio).toBe(5);
    expect(rpt.tiempo_aprox_entrega).toBe('30 - 45 min');
  });
});
