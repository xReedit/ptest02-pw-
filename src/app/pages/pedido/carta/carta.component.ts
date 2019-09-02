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


@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css', '../pedido.style.css']
})
export class CartaComponent implements OnInit {

  private objCarta: any;
  private isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  // max_minute_order = MAX_MINUTE_ORDER;
  // time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  private objSecciones: SeccionModel[] = [];
  private objItems: ItemModel[] = [];

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
      private navigatorService: NavigatorLinkService,
      ) {

  }

  ngOnInit() {
    this.isCargado = true;
    this.socketService.connect();

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      if (res.pageActive === 'carta') {
        if (this.countSeeBack < 2) { this.countSeeBack++; return; }
        this.goBack();
      } else {
        this.countSeeBack = 0;
      }
    });

    this.socketService.onGetCarta().subscribe(res => {
      this.objCarta = res;
      this.miPedidoService.setObjCarta(res);

      this.isCargado = false;
      this.showCategoria = true;
      // console.log(this.objCarta);

      this.miPedidoService.clearPedidoIsLimitTime();
      this.miPedidoService.updatePedidoFromStrorage();
    });

    // tipo de consumo
    this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel[]) => {
      // console.log('tipo consumo ', res);
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
    });

    // reglas de la carta y subtotales
    this.reglasCartaService.loadReglasCarta();

    this.miPedidoService.listenChangeCantItem();
    // this.socketService.onItemModificado().subscribe((res: ItemModel) => {
    //   const itemInList = this.miPedidoService.findItemCarta(res);
    //   itemInList.cantidad = res.cantidad;
    // });

    // this.socketService.onItemResetCant().subscribe((res: ItemModel) => {
    //   const itemInList = this.miPedidoService.findItemCarta(res);
    //   itemInList.cantidad += res.cantidad_reset;
    // });
  }

  getSecciones(categoria: CategoriaModel) {
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

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
    this.objItems.map(x => x.selected = false);
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

  getEstadoStockItem(stock: number): string {
    return stock > 10 ? 'verde' : stock > 5 ? 'amarillo' : 'rojo';
  }

}
