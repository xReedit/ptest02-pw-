import { Component, OnInit } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';

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

  // max_minute_order = MAX_MINUTE_ORDER;
  // time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];

  // objSelectedItem: ItemModel;
  objSeccionSelected: SeccionModel = new SeccionModel();

  // listItemsPedido: ItemModel[] = [];
  miPedido: PedidoModel = new PedidoModel();

  tiposConsumo: TipoConsumoModel[] = [];
  objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];

  constructor(
      private socketService: SocketService,
      private miPedidoService: MipedidoService
      ) { }

  ngOnInit() {
    this.isCargado = true;
    this.socketService.connect();

    this.socketService.onGetCarta().subscribe(res => {
      this.objCarta = res;
      this.miPedidoService.setObjCarta(res);

      this.isCargado = false;
      this.showCategoria = true;
      console.log(this.objCarta);

      this.miPedidoService.clearPedidoIsLimitTime();
      this.miPedidoService.updatePedidoFromStrorage();
    });

    // tipo de consumo
    this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel[]) => {
      console.log('tipo consumo ', res);
      this.tiposConsumo = res;

      // set tipos de consumo a new item tipo cosnumo para los item vista
      this.tiposConsumo.map((t: TipoConsumoModel) => {
        const _objTpcAdd = new ItemTipoConsumoModel();
        _objTpcAdd.descripcion = t.descripcion;
        _objTpcAdd.idtipo_consumo = t.idtipo_consumo;
        _objTpcAdd.titulo = t.titulo;

        this.objNewItemTiposConsumo.push(_objTpcAdd);
      });

      console.log('this.objNewItemTiposConsumo', this.objNewItemTiposConsumo);
      // this.tiposConsumo.secciones = [];
    });

    this.socketService.onItemModificado().subscribe((res: ItemModel) => {
      const itemInList = this.miPedidoService.findItemCarta(res);
      itemInList.cantidad = res.cantidad;
    });

    this.socketService.onItemResetCant().subscribe((res: ItemModel) => {
      const itemInList = this.miPedidoService.findItemCarta(res);
      itemInList.cantidad += res.cantidad_reset;
    });
  }

  getSecciones(categoria: CategoriaModel) {
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      this.tituloToolBar = categoria.des;
    }, 250);
  }

  getItems(seccion: SeccionModel) {
    this.miPedidoService.setObjSeccionSeleced(seccion);
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

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = selectedItem.itemtiposconsumo ? selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !selectedItem.itemtiposconsumo ) {
      selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);    
  }

  getEstadoStockItem(stock: number): string {
    return stock > 10 ? 'verde' : stock > 5 ? 'amarillo' : 'rojo';
  }

}
