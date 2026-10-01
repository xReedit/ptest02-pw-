import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { elegirSubtotalesEnvio, importeSubTotal, leerSubtotalesGuardados, Subtotales } from './subtotales-envio';
import { b64EncodeUnicode } from 'src/app/shared/utils/b64';

// ---------- carrito y calculo REAL de subtotales (MipedidoService.getArrSubTotales) ----------

interface ItemPrueba { idseccion: number; precio: number; cantidad: number; }
interface TpcPrueba { idtipo_consumo: number; descripcion: string; titulo?: string; items: ItemPrueba[]; }

function carrito(tpcs: TpcPrueba[]): any {
  return {
    tipoconsumo: tpcs.map(t => ({
      idtipo_consumo: t.idtipo_consumo,
      descripcion: t.descripcion,
      titulo: t.titulo || '',
      secciones: [...new Set(t.items.map(i => i.idseccion))].map(idseccion => ({
        idseccion,
        items: t.items.filter(i => i.idseccion === idseccion).map((i, n) => ({
          iditem: idseccion * 100 + n,
          idseccion: i.idseccion,
          precio_unitario: String(i.precio),
          cantidad_seleccionada: i.cantidad,
          precio_print: i.precio * i.cantidad,
        })),
      })),
    })),
  };
}

const SEDE_VIAIPI = { // configuracion real de VI-AI-PI (pedido del incidente)
  pwa_delivery_hablitar_calc_costo_servicio: 0,
  pwa_delivery_habilitar_calc_costo_servicio_solo_app: 1,
  pwa_delivery_comision_fija_no_afiliado: 0,
  pwa_delivery_comercio_paga_entrega: 1,
  pwa_delivery_servicio_propio: 1,
};

function subtotalesReales(pedido: any, reglas: any[], sede: any = SEDE_VIAIPI, esClienteDelivery = false): Subtotales {
  const svc: any = Object.create(MipedidoService.prototype);
  svc.miPedido = pedido;
  svc.establecimientoService = {
    establecimiento: sede,
    get: () => ({ c_servicio: sede.c_servicio || 0, c_minimo: sede.c_minimo || 4 }),
    setCostoSercioDelivery: () => {},
    getRulesSubTotales: () => [],
  };
  svc.infoTokenService = { infoUsToken: { isDelivery: esClienteDelivery } };
  svc.deliveryArrConstantes = { cantItemsScala: 0, costoScala: 0 };
  return svc.getArrSubTotales(JSON.parse(JSON.stringify(reglas))); // getArrSubTotales muta las reglas
}

const total = (arr: Subtotales) => parseFloat(String(arr[arr.length - 1].importe));

// reglas
const IGV_INACTIVO = { id: 37, tipo: 'p', monto: '18', nivel: 0, activo: 1, descripcion: 'I.G.V', es_impuesto: 1, idtipo_consumo: 0 };
const IGV_ACTIVO = { ...IGV_INACTIVO, activo: 0 };
const SERVICIO_10 = { id: 50, tipo: 'p', monto: '10', nivel: 0, activo: 1, descripcion: 'Servicio', es_impuesto: 0, idtipo_consumo: 0 };
const COMISION_TARJETA = { id: 51, tipo: 'p', monto: '5', nivel: 0, activo: 1, descripcion: 'COMISION TARJETA', es_impuesto: 0, idtipo_consumo: 0 };
const COSTO_DELIVERY_POR_PEDIDO = { id: 60, tipo: 'a', monto: '5', nivel: 1, activo: 1, descripcion: 'COSTO DELIVERY', es_impuesto: 0, idtipo_consumo: 95, idseccion: 0 };
const TAPER_POR_ITEM = { id: 61, tipo: 'a', monto: '1', nivel: 0, activo: 1, descripcion: 'Taper', es_impuesto: 0, idtipo_consumo: 2, idseccion: 24 };

// pedido del incidente: EXTRAS 02 COSTO DELIVERY 2.00 + 01 1/4 DE POLLO 17.00 = 19.00
const PEDIDO_G = carrito([{ idtipo_consumo: 95, descripcion: 'DELIVERY', items: [
  { idseccion: 1586, precio: 1, cantidad: 2 },
  { idseccion: 2727, precio: 17, cantidad: 1 },
] }]);
// pedido de la otra pestana (Leydti Hoyos): 44.00
const PEDIDO_OTRA_PESTANA = carrito([{ idtipo_consumo: 95, descripcion: 'DELIVERY', items: [
  { idseccion: 2727, precio: 17, cantidad: 2 },
  { idseccion: 1586, precio: 5, cantidad: 2 },
] }]);

describe('subtotales al enviar el pedido', () => {

  describe('caso real del incidente (VI-AI-PI, 30/09 20:07)', () => {
    const reglas = [IGV_INACTIVO];
    const correcto = () => subtotalesReales(PEDIDO_G, reglas);
    const deOtraPestana = () => subtotalesReales(PEDIDO_OTRA_PESTANA, reglas);

    it('el calculo real da 19.00 para el pedido de G y 44.00 para el de la otra pestana', () => {
      expect(total(correcto())).toBe(19);
      expect(total(deOtraPestana())).toBe(44);
    });

    it('sys::st con el total de la otra pestana (44) -> se envia 19 (el de esta pestana)', () => {
      const enMemoria = correcto();
      const elegido = elegirSubtotalesEnvio(deOtraPestana(), enMemoria, correcto());
      expect(elegido).toBe(enMemoria);
      expect(total(elegido)).toBe(19);
    });

    it('si tampoco hay total en memoria, se envia el recalculado (19)', () => {
      expect(total(elegirSubtotalesEnvio(deOtraPestana(), null, correcto()))).toBe(19);
      expect(total(elegirSubtotalesEnvio(deOtraPestana(), deOtraPestana(), correcto()))).toBe(19);
    });

    it('precio_print como texto ("17.00", asi viene en el pedido real) suma, no concatena', () => {
      const conTexto = JSON.parse(JSON.stringify(PEDIDO_G));
      conTexto.tipoconsumo[0].secciones.forEach((s: any) => s.items.forEach((i: any) => i.precio_print = i.precio_print.toFixed(2)));
      expect(total(subtotalesReales(conTexto, reglas))).toBe(19);
    });

    it('sin otra pestana todo sigue igual: se envia sys::st tal cual (misma referencia)', () => {
      const guardado = correcto();
      expect(elegirSubtotalesEnvio(guardado, correcto(), correcto())).toBe(guardado);
    });
  });

  describe('lo que arma el usuario en pantalla se respeta (sys::st del mismo carrito)', () => {
    const pedido = carrito([{ idtipo_consumo: 1, descripcion: 'CONSUMIR EN EL LOCAL', titulo: 'LOCAL', items: [
      { idseccion: 24, precio: 30, cantidad: 2 }, { idseccion: 10, precio: 12.5, cantidad: 1 },
    ] }]); // 72.50

    it('servicio no facturable (Servicio 10%) incluido en el total', () => {
      const arr = subtotalesReales(pedido, [IGV_INACTIVO, SERVICIO_10]);
      expect(total(arr)).toBeCloseTo(79.75, 2);
      expect(elegirSubtotalesEnvio(arr, null, subtotalesReales(pedido, [IGV_INACTIVO, SERVICIO_10]))).toBe(arr);
    });

    it('servicio opcional (COMISION TARJETA) quitado por el usuario: se conserva su eleccion', () => {
      const reglas = [IGV_INACTIVO, COMISION_TARJETA];
      const guardado = subtotalesReales(pedido, reglas);
      const fila = guardado.find(x => x.descripcion === 'COMISION TARJETA');
      fila.tachado = true; fila.quitar = true; fila.importe = '0.00';
      guardado[guardado.length - 1].importe = '72.50';
      const elegido = elegirSubtotalesEnvio(guardado, null, subtotalesReales(pedido, reglas));
      expect(elegido).toBe(guardado);
      expect(total(elegido)).toBe(72.5);
    });

    it('propina agregada (fila id -3): se conserva', () => {
      const guardado = subtotalesReales(pedido, [IGV_INACTIVO]);
      const filaTotal = guardado.pop();
      guardado.push({ id: -3, descripcion: 'Propina', importe: '3.00' });
      filaTotal.importe = 75.5;
      guardado.push(filaTotal);
      const elegido = elegirSubtotalesEnvio(guardado, null, subtotalesReales(pedido, [IGV_INACTIVO]));
      expect(elegido).toBe(guardado);
      expect(total(elegido)).toBe(75.5);
    });

    it('recojo en local (datos-delivery filtra filas y rehace el TOTAL): se conserva', () => {
      const reglas = [IGV_INACTIVO, SERVICIO_10];
      const completo = subtotalesReales(pedido, reglas);
      const filaTotal = completo[completo.length - 1];
      const recojo = completo.filter((x: any) => x.id >= 0 && x.descripcion !== 'TOTAL');
      filaTotal.importe = recojo.map((x: any) => parseFloat(x.importe)).reduce((a, b) => a + b, 0);
      recojo.push(filaTotal);
      expect(elegirSubtotalesEnvio(recojo, null, subtotalesReales(pedido, reglas))).toBe(recojo);
    });
  });

  describe('I.G.V. activo (SUB TOTAL sin impuesto, no es la suma de los productos)', () => {
    const pedido = carrito([{ idtipo_consumo: 1, descripcion: 'CONSUMIR EN EL LOCAL', titulo: 'LOCAL', items: [
      { idseccion: 24, precio: 33.33, cantidad: 3 },
    ] }]); // 99.99
    const otro = carrito([{ idtipo_consumo: 1, descripcion: 'CONSUMIR EN EL LOCAL', titulo: 'LOCAL', items: [
      { idseccion: 24, precio: 40, cantidad: 1 },
    ] }]);

    it('mismo carrito: se conserva aunque el SUB TOTAL no sea la suma de productos', () => {
      const guardado = subtotalesReales(pedido, [IGV_ACTIVO]);
      expect(importeSubTotal(guardado)).not.toBe(99.99);
      expect(elegirSubtotalesEnvio(guardado, null, subtotalesReales(pedido, [IGV_ACTIVO]))).toBe(guardado);
      expect(total(guardado)).toBeCloseTo(99.99, 2);
    });

    it('carrito de otra pestana: se reemplaza', () => {
      const elegido = elegirSubtotalesEnvio(subtotalesReales(otro, [IGV_ACTIVO]), null, subtotalesReales(pedido, [IGV_ACTIVO]));
      expect(total(elegido)).toBeCloseTo(99.99, 2);
    });
  });

  describe('costos adicionales', () => {
    it('por pedido (COSTO DELIVERY 5.00 en DELIVERY): mismo carrito se conserva, otro carrito se reemplaza', () => {
      const reglas = [IGV_INACTIVO, COSTO_DELIVERY_POR_PEDIDO];
      const bien = subtotalesReales(PEDIDO_G, reglas);
      expect(total(bien)).toBe(24); // 19 + 5
      expect(elegirSubtotalesEnvio(bien, null, subtotalesReales(PEDIDO_G, reglas))).toBe(bien);
      expect(total(elegirSubtotalesEnvio(subtotalesReales(PEDIDO_OTRA_PESTANA, reglas), null, subtotalesReales(PEDIDO_G, reglas)))).toBe(24);
    });

    it('por item (Taper 1.00 por plato para llevar)', () => {
      const llevar = carrito([{ idtipo_consumo: 2, descripcion: 'PARA LLEVAR', items: [{ idseccion: 24, precio: 20, cantidad: 3 }] }]);
      const reglas = [IGV_INACTIVO, TAPER_POR_ITEM];
      const bien = subtotalesReales(llevar, reglas);
      expect(total(bien)).toBe(63); // 60 + 3 tapers
      expect(elegirSubtotalesEnvio(bien, null, subtotalesReales(llevar, reglas))).toBe(bien);
    });
  });

  describe('bordes', () => {
    const recalc: Subtotales = [{ descripcion: 'SUB TOTAL', importe: '19.00' }, { descripcion: 'TOTAL', importe: '19.00' }];
    const conSub = (sub: string | number): Subtotales => [{ descripcion: 'SUB TOTAL', importe: sub }, { descripcion: 'TOTAL', importe: sub }];

    it('tolerancia de redondeo: 0.02 se acepta, 0.03 no', () => {
      const g1 = conSub('19.02');
      expect(elegirSubtotalesEnvio(g1, null, recalc)).toBe(g1);
      expect(elegirSubtotalesEnvio(conSub('19.03'), null, recalc)).toBe(recalc);
    });

    it('importes como numero o texto', () => {
      const g = conSub(19);
      expect(elegirSubtotalesEnvio(g, null, recalc)).toBe(g);
    });

    it('sin sys::st (null) usa memoria si cuadra, si no el recalculado', () => {
      const mem = conSub('19.00');
      expect(elegirSubtotalesEnvio(null, mem, recalc)).toBe(mem);
      expect(elegirSubtotalesEnvio(null, conSub('5.00'), recalc)).toBe(recalc);
      expect(elegirSubtotalesEnvio(null, null, recalc)).toBe(recalc);
    });

    it('sin reglas cargadas (no se puede recalcular): comportamiento anterior', () => {
      const g = conSub('44.00');
      expect(elegirSubtotalesEnvio(g, conSub('19.00'), null)).toBe(g);
      const mem = conSub('19.00');
      expect(elegirSubtotalesEnvio(null, mem, null)).toBe(mem);
    });

    it('sys::st sin fila SUB TOTAL o con importe invalido no se usa', () => {
      expect(elegirSubtotalesEnvio([{ descripcion: 'TOTAL', importe: '19.00' }], null, recalc)).toBe(recalc);
      expect(elegirSubtotalesEnvio(conSub('abc'), null, recalc)).toBe(recalc);
      expect(elegirSubtotalesEnvio([] as any, null, recalc)).toBe(recalc);
    });

    it('limite conocido: otra pestana con el MISMO sub total no se detecta (mismos productos = mismo cobro)', () => {
      const otra = [{ descripcion: 'SUB TOTAL', importe: '19.00' }, { descripcion: 'Propina', importe: '2.00' }, { descripcion: 'TOTAL', importe: '21.00' }];
      expect(elegirSubtotalesEnvio(otra, null, recalc)).toBe(otra);
    });
  });

  describe('leerSubtotalesGuardados', () => {
    it('lee base64 de JSON', () => {
      const arr = [{ descripcion: 'SUB TOTAL', importe: '19.00' }];
      expect(leerSubtotalesGuardados(b64EncodeUnicode(JSON.stringify(arr)))).toEqual(arr);
      expect(leerSubtotalesGuardados(btoa(JSON.stringify(arr)))).toEqual(arr); // guardado antiguo con btoa plano
    });

    it('vacio, corrupto o no-arreglo -> null (antes reventaba el envio)', () => {
      expect(leerSubtotalesGuardados(null)).toBeNull();
      expect(leerSubtotalesGuardados('')).toBeNull();
      expect(leerSubtotalesGuardados('%%%no-base64')).toBeNull();
      expect(leerSubtotalesGuardados(b64EncodeUnicode('{"a":1}'))).toBeNull();
      expect(leerSubtotalesGuardados(b64EncodeUnicode('no json'))).toBeNull();
    });
  });
});
