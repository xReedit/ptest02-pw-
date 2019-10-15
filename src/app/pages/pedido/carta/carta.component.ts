import { Component, OnInit } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { JsonPrintService } from 'src/app/shared/services/json-print.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';


@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css', '../pedido.style.css']
})
export class CartaComponent implements OnInit {

  objCarta: any;
  objCartaBus: any = [];
  isBusqueda = false;
  private isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  // max_minute_order = MAX_MINUTE_ORDER;
  // time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];

  // objSelectedItem: ItemModel;
  // objSeccionSelected: SeccionModel = new SeccionModel();

  // listItemsPedido: ItemModel[] = [];
  // miPedido: PedidoModel = new PedidoModel();

  private tiposConsumo: TipoConsumoModel[] = [];
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];
  private itemSelected: ItemModel;
  private countSeeBack = 2; // primera vista al dar goback

  constructor(
      private socketService: SocketService,
      private miPedidoService: MipedidoService,
      private reglasCartaService: ReglascartaService,
      private jsonPrintService: JsonPrintService,
      private navigatorService: NavigatorLinkService,
      private listenStatusService: ListenStatusService
      ) {

  }

  ngOnInit() {
    this.isCargado = true;
    this.socketService.connect();

    this.listeStatusBusqueda();

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      if (res.pageActive === 'carta') {
        if (this.countSeeBack < 2) { this.countSeeBack++; return; }
        this.goBack();
      } else {
        this.countSeeBack = 0;
      }
    });

    // console.log('aaa');
    // if (!this.socketService.isSocketOpen) {
      this.socketService.onGetCarta().subscribe((res: any) => {

        if (this.socketService.isSocketOpen) {
          // actualizar cantidad actual (stock actual) de ObjCarta del item
          if ( !this.miPedidoService.findIsHayItems() ) {
            this.objCarta = res;
            //
            this.miPedidoService.setObjCarta(res);

            this.isCargado = false;
            // this.showCategoria = true;
            console.log('objCarta desde socket reconect', this.objCarta);
            this.navigatorService.setPageActive('carta');
          }

          return;
        }
        this.objCarta = res;
        //
        this.miPedidoService.setObjCarta(res);

        this.isCargado = false;
        this.showCategoria = true;
        console.log('objCarta', this.objCarta);

        this.miPedidoService.clearPedidoIsLimitTime();
        this.miPedidoService.updatePedidoFromStrorage();

        // restaurar cuenta de timepo limite
        console.log('restore timer limt');
        this.miPedidoService.restoreTimerLimit();

        this.miPedidoService.listenChangeCantItem(); // cuando se reconecta para que actualize
      });

      // tipo de consumo
      this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel[]) => {
        // console.log('tipo consumo ', res);
        if (this.socketService.isSocketOpen) {return; }
        this.tiposConsumo = res;

        // set tipos de consumo a new item tipo cosnumo para los item vista
        this.tiposConsumo.map((t: TipoConsumoModel) => {
          const _objTpcAdd = new ItemTipoConsumoModel();
          _objTpcAdd.descripcion = t.descripcion;
          _objTpcAdd.idtipo_consumo = t.idtipo_consumo;
          _objTpcAdd.titulo = t.titulo;

          this.objNewItemTiposConsumo.push(_objTpcAdd);
        });

        this.navigatorService.addLink('carta-i-');

        // console.log('this.objNewItemTiposConsumo', this.objNewItemTiposConsumo);
        // this.tiposConsumo.secciones = [];

        this.loadItemsBusqueda();
      });
    // }

    // reglas de la carta y subtotales
    this.reglasCartaService.loadReglasCarta();

    // this.miPedidoService.listenChangeCantItem();

    // datos de la sede, impresoras
    this.jsonPrintService.getDataSede();
  }

  getSecciones(categoria: CategoriaModel) {
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      // local storage categoria
      localStorage.setItem('sys::cat', categoria.idcategoria.toString());

      this.tituloToolBar = categoria.des;
      this.navigatorService.addLink('carta-i-secciones');
    }, 250);
  }

  getItems(seccion: SeccionModel) {
    this.miPedidoService.setObjSeccionSeleced(seccion);
    setTimeout(() => {
      this.objItems = seccion.items;
      this.showSecciones = false;
      this.showItems = true;
      this.tituloToolBar += ' / ' + seccion.des;
      this.navigatorService.addLink('carta-i-secciones-items');
    }, 150);

  }


  /// busqueda
  loadItemsBusqueda() {
    let _objFind: any;
    // _objFind = this.miPedidoService.getObjCartaLibery();
    _objFind = this.miPedidoService.getObjCarta();

    // extraemos
    let _itemFind: any;
    _objFind.carta.map((c: CategoriaModel) => {
      c.secciones.map((s: SeccionModel) => {
        s.items.map((i: ItemModel) => {
          _itemFind = i;
          _itemFind.seccion = s.des;
          _itemFind.selected = false;
          _itemFind.visible = true;
          this.objCartaBus.push(_itemFind);
        });
      });
    });

    // reset busqueda
    window.localStorage.setItem('sys::find', '');
    // tipo consumo
    console.log('_objFind', this.objCartaBus);
  }



  goBack() {
    this.objItems.map(x => x.selected = false);
    if (this.showItems) {
      this.showItems = false;
      this.showSecciones = true;
      this.tituloToolBar = this.tituloToolBar.split(' / ')[0];
      // this.navigatorService.addLink('carta-i-secciones');
      return;
    }
    if (this.showSecciones) {
      this.showSecciones = false; this.showToolBar = false; this.showCategoria = true;
      // this.navigatorService.addLink('carta-i-');
    }
  }

  selectedItem(selectedItem: ItemModel) {
    if (!this.isBusqueda) {
      this.objItems.map(x => x.selected = false);
    } else {
      this.objCartaBus.map(x => x.selected = false);
    }

    if ( selectedItem.cantidad.toString() === '0' && !selectedItem.cantidad_seleccionada ) { return; }

    selectedItem.selected = true;
    this.itemSelected = selectedItem;

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = selectedItem.itemtiposconsumo ? selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !selectedItem.itemtiposconsumo ) {
      selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);
  }

  addItemToPedido(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, suma);
  }

  addItemIndicaciones(itemCarta: ItemModel, _indicaciones: string): void {
    console.log('indicaciones', _indicaciones);
    this.itemSelected.indicaciones = _indicaciones;
    itemCarta.indicaciones = _indicaciones;

    const _itemInMipedido = this.miPedidoService.findOnlyItemMiPedido(itemCarta);
    if ( _itemInMipedido ) {
      _itemInMipedido.indicaciones = _indicaciones;
    }
  }

  getEstadoStockItem(stock: string): string {
    if ( stock === 'ND' ) {
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

  private listeStatusBusqueda(): void {
    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
    });

    this.listenStatusService.charBuqueda$.subscribe((res: string) => {
      this.isBusquedaFindNow(res);
    });
  }

  private isBusquedaFindNow(charFind: string): void {
    charFind = charFind.toLowerCase();
    console.log(charFind);
    let _charConcat = '';
    this.objCartaBus.map((i: any) => {
      _charConcat = `${i.des} ${i.seccion} ${i.detalles}`;
      _charConcat = _charConcat.toLowerCase();
      i.visible = _charConcat.indexOf(charFind) > -1 ? true : false;
    });
  }

}
