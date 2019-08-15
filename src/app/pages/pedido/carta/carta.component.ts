import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { StorageService } from 'src/app/shared/services/storage.service';
import { MAX_MINUTE_ORDER } from 'src/app/shared/config/config.const';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';

@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css']
})
export class CartaComponent implements OnInit {

  public objCarta: any;
  public isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  max_minute_order = MAX_MINUTE_ORDER;
  time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];

  objSelectedItem: ItemModel;
  objSeccionSelected: SeccionModel = new SeccionModel();

  listItemsPedido: ItemModel[] = [];
  miPedido: PedidoModel = new PedidoModel();

  tiposConsumo: TipoConsumoModel = new TipoConsumoModel();

  constructor(
      private socketService: SocketService,
      private storageService: StorageService
      ) { }

  ngOnInit() {
    this.isCargado = true;
    this.socketService.connect();

    this.socketService.onGetCarta().subscribe(res => {
      this.objCarta = res;
      this.isCargado = false;
      this.showCategoria = true;
      // console.log(this.objCarta);
      this.clearPedidoIsLimitTime();
      this.updatePedidoFromStrorage();
    });

    // tipo de consumo
    this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel) => {
      // console.log('tipo consumo ', res);
      this.tiposConsumo = res;
      this.tiposConsumo.secciones = [];
    });

    this.socketService.onItemModificado().subscribe((res: ItemModel) => {
      // console.log('itemModificado', res);
      const itemInList = this.findItemCarta(res);
      itemInList.cantidad = res.cantidad;
      // console.log('itemUpdate', itemInList);
    });

    this.socketService.onItemResetCant().subscribe((res: ItemModel) => {
      // console.log('itemResetCant', res);
      const itemInList = this.findItemCarta(res);
      itemInList.cantidad += res.cantidad_reset;
      // console.log('itemResetCant', itemInList);
    });
  }

  getSecciones(categoria: CategoriaModel) {
    // console.log(categoria);
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      this.tituloToolBar = categoria.des;
    }, 150);
  }

  getItems(seccion: SeccionModel) {
    // console.log(seccion);
    this.objSeccionSelected.des = seccion.des;
    this.objSeccionSelected.idimpresora = seccion.idimpresora;
    this.objSeccionSelected.idseccion = seccion.idseccion;
    this.objSeccionSelected.sec_orden = seccion.sec_orden;
    this.objSeccionSelected.ver_stock_cero = seccion.ver_stock_cero;
    // this.objSeccionSelected = seccion;
    setTimeout(() => {
      this.objItems = seccion.items;
      this.showSecciones = false;
      this.showItems = true;
      this.tituloToolBar += ' / ' + seccion.des;
    }, 150);

  }

  goBack() {
    if (this.showItems) {
      this.showItems = false;
      this.showSecciones = true;
      this.tituloToolBar = this.tituloToolBar.split(' / ')[0];
      return;
    }
    if (this.showSecciones) { this.showSecciones = false; this.showToolBar = false; this.showCategoria = true; }
  }

  selectedItem(selectedItem: ItemModel) {
    this.objItems.map(x => x.selected = false);
    selectedItem.selected = true;
    // this.cantItem = 0;
  }

  // 0 = sumar | 1 restar
  addItem(tipoconsumo: TipoConsumoModel, item: ItemModel, signo: number = 0) {
    let cantSeleccionada = item.cantidad_seleccionada || 0;
    let cantItem = item.cantidad;
    if (signo === 0) { // suma
      cantSeleccionada = cantItem <= 0 ? cantSeleccionada : cantSeleccionada + 1;
      cantItem = cantItem <= 0 ? cantItem : cantItem - 1;
    } else {
      cantSeleccionada -= 1;
      cantItem = cantSeleccionada < 0 ? cantItem : cantItem + 1;
      cantSeleccionada = cantSeleccionada < 0 ? 0 : cantSeleccionada;
    }
    // cantSeleccionada = signo === 0 ? cantSeleccionada + 1 : cantSeleccionada - 1;
    // cantSeleccionada = cantSeleccionada < 0 ? 0 : cantSeleccionada;

    const itemInPedido = this.findItemMiPedido(tipoconsumo, this.objSeccionSelected, item);
    // if (itemInPedido) {
      itemInPedido.cantidad_seleccionada = cantSeleccionada;
      itemInPedido.cantidad = cantItem;
      item.cantidad_seleccionada = cantSeleccionada;
      item.cantidad = cantItem;
    // } else {
      // nueva item
      // this.objSeccionSelected.items.push(item);
      // tipoconsumo.secciones = tipoconsumo.secciones ? tipoconsumo.secciones : [];
      // tipoconsumo.secciones.push(this.objSeccionSelected);

    // }

    // console.log('tipoconsumo', tipoconsumo);
    console.log('this.miPedido', this.miPedido);


    const itemInList = this.findItemFromArr(this.listItemsPedido, item); // <ItemModel>this.listItemsPedido.filter( x => x.iditem === item.iditem )[0];
    if (itemInList ) {
      itemInList.cantidad_seleccionada = cantSeleccionada;
      itemInList.cantidad = cantItem;
      item.cantidad_seleccionada = cantSeleccionada;
      item.cantidad = cantItem;
    } else {
      // tipoconsumo.secciones[0].items[item.idcarta_lista] = item;
      // this.miPedido.tipoconsumo[tipoconsumo.idtipo_consumo] = tipoconsumo;


      item.cantidad_seleccionada = cantSeleccionada;
      item.cantidad = cantItem;
      item._tiposconsumo.push(tipoconsumo);
      this.listItemsPedido.push(item);
    }

    // hora que comienza a realizar el pedido
    this.setLocalStorageHora();

    // guardamos el pedido en local // por si se actualiza
    this.setLocalStoragePedido();

    // emitir item modificado
    this.socketService.emit('itemModificado', item);

    // console.log(itemInList);
    console.log('listItemsPedido', this.listItemsPedido);
  }

  findItemFromArr(arrFind: any, item: ItemModel) {
    return arrFind.filter((x: any) => x.iditem === item.iditem)[0];
  }

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

  findItemMiPedido(tpc: TipoConsumoModel, seccion: any, item: ItemModel): ItemModel  {
    let rpt: ItemModel;
    const findTpc = <TipoConsumoModel>this.miPedido.tipoconsumo.filter((x: TipoConsumoModel) => x.idtipo_consumo === tpc.idtipo_consumo)[0];
    if (findTpc ) {
      const findSecc = <SeccionModel>findTpc.secciones.filter( (sec: SeccionModel) => sec.idseccion === seccion.idseccion )[0];
      if ( findSecc ) {
        const _rpt = findSecc.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
        if (_rpt) {
          rpt = _rpt;
        } else {
          // si no existe item lo agrega
          findSecc.items.push(item);
          rpt = item;
        }
      } else {
        // si no existe seccion add
        seccion.items.push(item);
        findTpc.secciones.push(seccion);
      }
    } else {
      // si no existe tpc add
      const _newSeccion = JSON.parse(JSON.stringify(seccion));
      _newSeccion.items = [];
      _newSeccion.items.push(item);
      tpc.secciones = tpc.secciones ? tpc.secciones : [];
      tpc.secciones.push(_newSeccion);
      this.miPedido.tipoconsumo.push(tpc);
      rpt = item;
    }

    return rpt;

      // .map(a => a.secciones).map((sec: any) => {
      //   const _rpt = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
      //   if (_rpt) {
      //     rpt = _rpt;
      //     return rpt;
      //   }
      // })

    // this.objCarta.carta.map((cat: CategoriaModel) => {
    //   cat.secciones.map((sec: SeccionModel) => {
    //     const _rpt = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0];
    //     if (_rpt) {
    //       rpt = _rpt;
    //       return rpt;
    //     }
    //   });
    // });

    //return rpt;
  }

  setLocalStorageHora() {
    if ( this.storageService.isExistKey('sys::h')) { return; }    
    const hora = `${this.time.getHours()}:${this.time.getMinutes()}:${this.time.getSeconds()}`;
    this.storageService.set('sys::h', hora.toString());
  }

  setLocalStoragePedido() {
    this.storageService.set('sys::order', JSON.stringify(this.listItemsPedido));    
  }

  clearPedidoIsLimitTime() {
    if (!this.storageService.isExistKey('sys::order')) { return; }
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(this.storageService.get('sys::order'));

    if (this.isTimeLimit()) {
      // si el tiempo limite fue superado mandamos a restablecer carta
      this.socketService.emit('resetPedido', this.listItemsPedido);
      this.updatePedidoFromClear();
    }
  }

  updatePedidoFromStrorage() {
    if (!this.storageService.isExistKey('sys::order') ) { return; }
    // if ( !this.storageService.isExistKey('sys::h') ) { return; }
    this.listItemsPedido = JSON.parse(this.storageService.get('sys::order'));

    // actualizar // buscar cada item en el obj carta
    this.listItemsPedido.map((item: ItemModel) => {
      if ( item.isalmacen === 0 ) {
        this.objCarta.carta.map((cat: CategoriaModel) => {
          cat.secciones.map((sec: SeccionModel) => {
            const itemUpdate = sec.items.filter((x: ItemModel) => x.idcarta_lista === item.idcarta_lista)[0]
            if ( itemUpdate ) {
              itemUpdate.cantidad_seleccionada = item.cantidad_seleccionada;
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
    this.listItemsPedido = [];
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

}
