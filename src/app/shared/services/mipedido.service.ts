import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

import { StorageService } from './storage.service';
import { SocketService } from './socket.service';

import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { MAX_MINUTE_ORDER } from '../config/config.const';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { match } from 'minimatch';

@Injectable({
  providedIn: 'root'
})
export class MipedidoService {

  private miPedidoSource = new BehaviorSubject<PedidoModel>(new PedidoModel());
  public miPedidoObserver$ = this.miPedidoSource.asObservable();

  public objCarta: any;
  listItemsPedido: ItemModel[] = [];
  miPedido: PedidoModel = new PedidoModel();

  objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  objSeccionSelected: SeccionModel = new SeccionModel();

  time = new Date();
  max_minute_order = MAX_MINUTE_ORDER;

  constructor(
    private storageService: StorageService,
    private socketService: SocketService) {
      // console.log('aaaaaaaaaaaaa');
    }

  getObjCarta() {
    return this.objCarta;
  }

  setObjCarta(_objCarta: any) {
    this.objCarta = _objCarta;
  }

  getMiPedido(): PedidoModel {
    if ( this.miPedido.tipoconsumo.length === 0 ) {
      if (this.storageService.isExistKey('sys::order::all')) {
        this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));      
      }
    }
    // this.miPedidoSource.next(this.miPedido);
    return this.miPedido;
  }

  // setea los tipos de consumo del item seleccionado para sumar las cantidaddes seleccionadas
  setobjItemTipoConsumoSelected(_objItemTipoConsumoSelected: ItemTipoConsumoModel[]) {
    this.objItemTipoConsumoSelected = _objItemTipoConsumoSelected;
  }

  // seteamos seccion seleccionada menos items[]; para que no se forme el bucle
  setObjSeccionSeleced(seccion: SeccionModel) {
    this.objSeccionSelected.des = seccion.des;
    this.objSeccionSelected.idimpresora = seccion.idimpresora;
    this.objSeccionSelected.idseccion = seccion.idseccion;
    this.objSeccionSelected.sec_orden = seccion.sec_orden;
    this.objSeccionSelected.ver_stock_cero = seccion.ver_stock_cero;
  }

  // suma cantidad seleccionada
  addItem2(tipoconsumo: ItemTipoConsumoModel, item: ItemModel, signo: number = 0) {
    let sumTotalTpcSelected = this.totalItemTpcSelected();
    let cantItem = parseInt(item.cantidad.toString(), 0);
    const sumar = signo === 0 ? true : false;

    if (cantItem <= 0 && sumar) { return; }

    let cantSeleccionada = tipoconsumo.cantidad_seleccionada || 0;
    cantSeleccionada += sumar ? 1 : -1;
    if (cantSeleccionada < 0) { return; }

    cantItem += sumar ? -1 : 1;
    cantSeleccionada = cantSeleccionada < 0 ? 0 : cantSeleccionada;
    cantItem = cantItem < 0 || cantSeleccionada < 0 ? 0 : cantItem;
    tipoconsumo.cantidad_seleccionada = cantSeleccionada;

    sumTotalTpcSelected = this.totalItemTpcSelected() || 0;
    item.cantidad_seleccionada = sumTotalTpcSelected;
    item.cantidad = cantItem;

    // this.estadoItemColor = this.getEstadoStockItem(cantItem);


    // json pedido
    const _tipoconsumo = JSON.parse(JSON.stringify(tipoconsumo));
    const itemInPedido = this.findItemMiPedido(_tipoconsumo, this.objSeccionSelected, item, sumar);
    // if ( !itemInPedido ) { itemInPedido = new item }
    // itemInPedido.cantidad_seleccionada = sumTotalTpcSelected;
    itemInPedido.cantidad = cantItem;

    // para el local storage recuperar y resetear
    const itemInList = this.findItemFromArr(this.listItemsPedido, item); // <ItemModel>this.listItemsPedido.filter( x => x.iditem === item.iditem )[0];
    if (itemInList) {
      itemInList.cantidad_seleccionada = sumTotalTpcSelected;
      itemInList.cantidad = cantItem;
    } else {
      this.listItemsPedido.push(item);
    }

    // hora que comienza a realizar el pedido
    this.setLocalStorageHora();

    // guardamos el pedido en local // por si se actualiza
    this.setLocalStoragePedido();

    // emitir item modificado
    this.socketService.emit('itemModificado', item);

    // console.log('listItemsPedido', this.listItemsPedido);
    // console.log('this.miPedido', this.miPedido);
  }

  totalItemTpcSelected(): number {
    return this.objItemTipoConsumoSelected.map((x: ItemTipoConsumoModel) => x.cantidad_seleccionada || 0).reduce((a, b) => a + b, 0);
  }

  // buscar item en listItemsPedido
  findItemFromArr(arrFind: any, item: ItemModel) {
    return arrFind.filter((x: any) => x.iditem === item.iditem)[0];
  }

  // buscar item en la carta
  findItemCarta(item: ItemModel): ItemModel {
    let rpt: ItemModel;
    this.objCarta.carta.map((cat: CategoriaModel) => {
      cat.secciones.map((sec: SeccionModel) => {
        const _rpt = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
        if (_rpt) {
          rpt = _rpt;
          return rpt;
        }
      });
    });

    return rpt;
  }

  findItemMiPedido(tpc: any, seccion: any, item: ItemModel, sumar: boolean): ItemModel {
    let rpt: ItemModel;
    // let elItem = item;
    let elItem = <ItemModel>JSON.parse(JSON.stringify(item));
    const cantSeleccionadaTPC = tpc.cantidad_seleccionada;
    elItem.itemtiposconsumo = [];
    this.addCantItemMiPedido(elItem, cantSeleccionadaTPC);

    const findTpc = <TipoConsumoModel>this.miPedido.tipoconsumo.filter((x: TipoConsumoModel) => x.idtipo_consumo === tpc.idtipo_consumo)[0];
    if (findTpc) {
      const findSecc = <SeccionModel>findTpc.secciones.filter((sec: SeccionModel) => sec.idseccion === seccion.idseccion)[0];
      if (findSecc) {
        const _rpt = findSecc.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
        if (_rpt) {
          this.addCantItemMiPedido(_rpt, cantSeleccionadaTPC);
          elItem = _rpt;
          // elItem.cantidad_seleccionada = this.addCantItemMiPedido(elItem.cantidad_seleccionada, sumar);
          rpt = elItem;
        } else {
          // si no existe item lo agrega
          // elItem.cantidad_seleccionada = 0;
          findSecc.items.push(elItem);
          rpt = elItem;
        }
      } else {
        // si no existe seccion add
        rpt = elItem;
        seccion.items.push(rpt);
        findTpc.secciones.push(seccion);
      }
    } else {
      // si no existe tpc add
      // elItem.cantidad_seleccionada = 0;
      const _newSeccion = JSON.parse(JSON.stringify(seccion));
      _newSeccion.items = [];
      _newSeccion.items.push(elItem);
      tpc.secciones = tpc.secciones ? tpc.secciones : [];
      tpc.secciones.push(_newSeccion);
      this.miPedido.tipoconsumo.push(tpc);
      rpt = elItem;
    }

    this.miPedidoSource.next(this.miPedido);
    return rpt;
  }

  addCantItemMiPedido(elItem: ItemModel, cantidad_seleccionada: number) {
    const cantSeleccionadaTPC = cantidad_seleccionada;
    const precioTotal = cantSeleccionadaTPC * parseFloat(elItem.precio);
    elItem.cantidad_seleccionada = cantSeleccionadaTPC;
    elItem.precio_total = precioTotal;
    // elItem.precio_total_calc = precioTotal;
    elItem.precio_print = precioTotal;
  }



  setLocalStorageHora() {
    if (this.storageService.isExistKey('sys::h')) { return; }
    const hora = `${this.time.getHours()}:${this.time.getMinutes()}:${this.time.getSeconds()}`;
    this.storageService.set('sys::h', hora.toString());
  }

  setLocalStoragePedido() {
    this.storageService.set('sys::order', btoa(JSON.stringify(this.listItemsPedido)));
    this.storageService.set('sys::order::all', btoa(JSON.stringify(this.miPedido)));
  }

  clearPedidoIsLimitTime() {
    if (!this.storageService.isExistKey('sys::order')) { return; }
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(atob(this.storageService.get('sys::order')));
    this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));

    if (this.isTimeLimit()) {
      // si el tiempo limite fue superado mandamos a restablecer carta
      this.socketService.emit('resetPedido', this.listItemsPedido);
      this.updatePedidoFromClear();
    }
  }

  updatePedidoFromStrorage() {
    if (!this.storageService.isExistKey('sys::order')) { return; }
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(atob(this.storageService.get('sys::order')));
    this.miPedido = JSON.parse(atob(this.storageService.get('sys::order::all')));
    this.miPedidoSource.next(this.miPedido);

    // actualizar // buscar cada item en el obj carta
    this.listItemsPedido.map((item: ItemModel) => {
      if (item.isalmacen === 0) {
        this.objCarta.carta.map((cat: CategoriaModel) => {
          cat.secciones.map((sec: SeccionModel) => {
            const itemUpdate = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0]
            if (itemUpdate) {
              // itemUpdate.cantidad = item.cantidad;
              itemUpdate.cantidad_seleccionada = item.cantidad_seleccionada;
              itemUpdate.itemtiposconsumo = item.itemtiposconsumo;
            }
          });
        });
      }
    });
  }

  // actualiza la carta del pedido reseteado por tiempo limite
  // solo local porque a los demas se le emite el socket
  updatePedidoFromClear() {
    // actualizar // buscar cada item en el obj carta
    this.listItemsPedido.map((item: ItemModel) => {
      if (item.isalmacen === 0) {
        this.objCarta.carta.map((cat: CategoriaModel) => {
          cat.secciones.map((sec: SeccionModel) => {
            const itemUpdate = <ItemModel>sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
            if (itemUpdate) {
              itemUpdate.cantidad = parseInt(itemUpdate.cantidad.toString(), 0) + item.cantidad_seleccionada;
            }
          });
        });
      }
    });

    // valor en blanco para nuevo pedido
    this.storageService.clear('sys::h');
    this.storageService.clear('sys::order');
    this.storageService.clear('sys::order::all');
    this.listItemsPedido = [];
    this.miPedido = new PedidoModel();
    this.miPedidoSource.next(this.miPedido);
  }

  getEstadoStockItem(stock: number): string {
    return stock > 10 ? 'verde' : stock > 5 ? 'amarillo' : 'rojo';
  }

  isTimeLimit(): boolean {
    const h2 = this.storageService.get('sys::h');
    const hora1 = this.time.getTime().toString().split(':');
    const hora2 = h2.split(':');
    const t1 = new Date();
    const t2 = new Date();

    // tslint:disable-next-line: radix
    t1.setHours(parseInt(hora2[0], 0), parseInt(hora2[1], 0), parseInt(hora2[2], 0));
    t2.setHours(this.time.getHours(), this.time.getMinutes(), this.time.getSeconds());
    const dif = t2.getTime() - t1.getTime(); // diferencia en milisegundos
    const difSeg = Math.floor(dif / 1000);
    const difMin = Math.floor(difSeg / 60);
    let minutos = difMin % 60; // minutos
    minutos = minutos < 0 ? minutos * -1 : minutos;
    return minutos > this.max_minute_order ? true : false;

  }


  // <------ reglas de la carta ----> //

  validarReglasCarta(rules: any[]): any {
    // let diferencia = 0;
    let xSecc_bus = 0;
    let xSecc_detalle = 0;
    let xCantidadBuscar = 0;
    let xCantidadBuscarSecc_detalle = 0;
    let diferencia = 0;

    let xPrecio_item_bus = 0;
    let xPrecio_mostrado = 0; // preciounitario * cantidad precio_total_cal

    // reset precio_total_calc -> precio_total;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((z: SeccionModel) => {
          z.items.map((n: ItemModel) => n.precio_total_calc = null)
        });
      });

    rules.map((regla: any) => {
      xSecc_bus = regla.idseccion;
      xSecc_detalle = regla.idseccion_detalle;
      xCantidadBuscar = this.countCantItemsFromSeccion(xSecc_bus);
      xCantidadBuscarSecc_detalle = this.countCantItemsFromSeccion(xSecc_detalle);

      diferencia = xCantidadBuscar - xCantidadBuscarSecc_detalle;
      diferencia = diferencia < 0 ? xCantidadBuscar : diferencia; // no valores negativos 
      // console.log('diferencia reglas', diferencia);

      this.miPedido.tipoconsumo
        .map((tpc: TipoConsumoModel) => {
          tpc.secciones
            .filter((z: SeccionModel) => z.idseccion === xSecc_detalle)
            .map((z: SeccionModel) => {
              z.items
                .map((n: ItemModel, i) => {
                  const precioUnitario_item = parseFloat(n.precio);
                  const cant_item = n.cantidad_seleccionada;

                  xPrecio_mostrado = n.precio_total_calc !== null ? n.precio_total_calc : n.precio_total;
                  xPrecio_item_bus = xPrecio_mostrado;

                  if ( xCantidadBuscar >= xCantidadBuscarSecc_detalle) {
                    xPrecio_item_bus = 0;
                  } else if (diferencia > 0) {
                    xPrecio_item_bus = diferencia * precioUnitario_item;
                    xPrecio_item_bus = xPrecio_mostrado - xPrecio_item_bus; // descuenta del precio que se muestra en pantalla( precio que ya fue procesado)
                    xPrecio_item_bus = xPrecio_item_bus < 0 ? 0 : xPrecio_item_bus;

                    diferencia = diferencia - cant_item < 0 ? 0 : diferencia - cant_item;
                  }

                  n.precio_total_calc = xPrecio_item_bus; //
                  n.precio_print = xPrecio_item_bus; //
                  n.cantidad_descontado = cant_item;
                });
            });
        });

    });
  }

  private countCantItemsFromSeccion(seccionSearch: number): number {
    let sum = 0;
    this.miPedido.tipoconsumo
    .map((tpc: TipoConsumoModel) => {
      tpc.secciones.map((z: SeccionModel) => {
        sum += z.items
          .filter((x: ItemModel) => x.idseccion === seccionSearch)
          .map((x: ItemModel) => x.cantidad_seleccionada)
          .reduce((a, b) => a + b, 0);
      });
    });

    return sum;
  }

  // devuelve cantidad item filtrando tipoconsumo y seccion
  private countCantItemsFromTpcSeccion(tipoconsumo: number, seccionSearch: number): number {
    let sum = 0;
    this.miPedido.tipoconsumo
    .filter((tpc: TipoConsumoModel) => tpc.idtipo_consumo === tipoconsumo)
    .map((tpc: TipoConsumoModel) => {
      tpc.secciones
      .map((z: SeccionModel) => {
        sum += z.items
          .filter((x: ItemModel) => x.idseccion === seccionSearch)
          .map((x: ItemModel) => x.cantidad_seleccionada)
          .reduce((a, b) => a + b, 0);
      });
    });

    return sum;
  }

  // <------ reglas de la carta ---->//

  // <------ sub totales ---->//

  getArrSubTotales(rulesSubTotales: any[]) {
    const subTotal = this.getSubTotalMiPedido();
    let sumaTotal = subTotal;

    const arrSubtotales: any = [];
    let _arrSubtotales: any = [];

    _arrSubtotales.id = 0;
    _arrSubtotales.descripcion = 'Sub Total';
    _arrSubtotales.esImpuesto = 0;
    _arrSubtotales.visible = true;
    _arrSubtotales.quitar = false;
    _arrSubtotales.tachado = false;
    _arrSubtotales.visible_cpe = true;
    _arrSubtotales.importe = subTotal;

    arrSubtotales.push(_arrSubtotales);


    // porcentajes / impuestos / otros servicios
    const rptPorcentajes: any = [];
    const arrPorcentajes = rulesSubTotales.filter(x => x.tipo === 'p');
    arrPorcentajes.map(p => {
      const porcentaje = p.monto / 100;
      const isImpuesto = p.es_impuesto === 1 ? true : false;
      const isActivo = p.activo === 0 ? true : false;
      const importe = (subTotal * porcentaje).toFixed(2);
      const rpt: any = [];

      rpt.id = p.tipo + p.id;
      rpt.descripcion = p.descripcion;
      rpt.esImpuesto = p.es_impuesto;
      rpt.visible = true;
      rpt.quitar = false;
      rpt.tachado = false;
      rpt.visible_cpe = isImpuesto;
      rpt.importe = isImpuesto ? isActivo ? importe : 0 : importe;

      sumaTotal += parseFloat(rpt.importe);

      rptPorcentajes.push(rpt);
    });

    // otros no porcentajes
    let importeOtros = 0;
    const rptOtros: any = [];
    const arrOtros = rulesSubTotales.filter(x => x.tipo === 'a');
    arrOtros.map(p => {
      const rpt: any = [];
      importeOtros = parseFloat(p.monto); // aplica a todo el pedido

      const cantidad = this.countCantItemsFromTpcSeccion(p.idtipo_consumo, p.idseccion);
      if ( cantidad === 0 ) { return; } // si no encontro items con esos criterios

      if (p.nivel === 0) { // aplica por item
        importeOtros = cantidad * parseFloat(p.monto);
      }

      rpt.id = p.tipo + p.id;
      rpt.descripcion = p.descripcion;
      rpt.esImpuesto = p.es_impuesto;
      rpt.visible = true;
      rpt.quitar = true;
      rpt.tachado = true;
      rpt.visible_cpe = false;
      rpt.importe = importeOtros;

      sumaTotal += parseFloat(rpt.importe);

      // juntar si son del mismo tipo ej: taper - llevar, taper - delivery
      const findItem = rptOtros.filter((x: any) => x.descripcion === rpt.descripcion)[0];
      if (findItem) {
        findItem.importe += parseFloat(rpt.importe);
      } else {
        rptOtros.push(rpt);
      }


    });

    // juntamos
    rptPorcentajes.map(y => arrSubtotales.push(y));
    rptOtros.map(y => arrSubtotales.push(y));

    _arrSubtotales = [];
    _arrSubtotales.id = 0;
    _arrSubtotales.esImpuesto = 0;
    _arrSubtotales.descripcion = 'Total';
    _arrSubtotales.visible = true;
    _arrSubtotales.quitar = false;
    _arrSubtotales.tachado = false;
    _arrSubtotales.visible_cpe = true;
    _arrSubtotales.importe = sumaTotal;

    arrSubtotales.push(_arrSubtotales);

    console.log('totales', arrSubtotales);

  }

  private getSubTotalMiPedido(): number {
    let sumSubTotal = 0;
    this.miPedido.tipoconsumo
      .map((tpc: TipoConsumoModel) => {
        tpc.secciones.map((z: SeccionModel) => {
          sumSubTotal += z.items
            .map((x: ItemModel) => x.precio_print)
            .reduce((a, b) => a + b, 0);
        });
      });

    return sumSubTotal;
  }


  // <------ sub totales ---->//


}
