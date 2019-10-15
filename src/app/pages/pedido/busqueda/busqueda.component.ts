import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css', '../pedido.style.css']
})
export class BusquedaComponent implements OnInit {

  objCartaBus: any = [];

  private itemSelected: ItemModel;
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];

  constructor(
    private socketService: SocketService,
    private miPedidoService: MipedidoService,
  ) { }

  ngOnInit() {
  }

  loadItemsBusqueda() {
    let _objFind: any;
    _objFind = this.miPedidoService.getObjCartaLibery();

    // extraemos
    let _itemFind: any;
    _objFind.carta.map((c: CategoriaModel) => {
      c.secciones.map((s: SeccionModel) => {
        s.items.map((i: ItemModel) => {
          _itemFind = i;
          _itemFind.seccion = s.des;
          _itemFind.selected = false;
          this.objCartaBus.push(_itemFind);
        });
      });
    });

    // tipo consumo
    this.objNewItemTiposConsumo = this.socketService.getDataTipoConsumo();
    console.log('_objFind', this.objCartaBus);
  }

  selectedItem(selectedItem: ItemModel) {
    this.objCartaBus.map(x => x.selected = false);
    selectedItem.selected = true;
    this.itemSelected = selectedItem;

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = selectedItem.itemtiposconsumo ? selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !selectedItem.itemtiposconsumo ) {
      selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);
  }

  getEstadoStockItem(stock: string): string {
    if ( stock === 'ND' ) {
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

}
