import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SubItemsView } from 'src/app/modelos/subitems.view.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { SubItem } from 'src/app/modelos/subitems.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';


@Component({
  selector: 'app-dialog-subitem-remove',
  templateUrl: './dialog-subitem-remove.component.html',
  styleUrls: ['./dialog-subitem-remove.component.css']
})
export class DialogSubitemRemoveComponent implements OnInit {

  item: ItemModel;
  subItemView: SubItemsView;
  itemTipoConsumoSelected: ItemTipoConsumoModel;
  idTpcItemResumenSelect: number;

  objItemTipoConsumoSelected: ItemTipoConsumoModel[];

  constructor(
    public miPedidoService: MipedidoService,
    private dialogRef: MatDialogRef<DialogSubitemRemoveComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.idTpcItemResumenSelect = data.idTpcItemResumenSelect;
    this.item = data.item;
    this.subItemView = data.subItemView;
    this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>data.objItemTipoConsumoSelected;

    // this.itemTipoConsumoSelected = JSON.parse(JSON.stringify(data.itemTipoConsumoSelected));
    // this.itemTipoConsumoSelected = data.itemTipoConsumoSelected;


    // this.item.cantidad = this.getCantidadItemCarta(); // trae el stock del item carta
    this.miPedidoService.setObjSeccionSeleced(data.seccion);
    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);
    // this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>data.objItemTipoConsumoSelected;
    // this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

  }

  ngOnInit() {

  }

  // op > 0 = uno 1 = todo
  quitarSubItem(op: number): void {
    if (op === 0) {
      console.log('quitar subitemview');
      // this.miPedidoService.restarCantSubItemView(this.elitem, this.subItemView);
      // this.itemTipoConsumoSelected.cantidad_seleccionada = this.item.cantidad_seleccionada;

      // tipo consumo
      const _tpc =  <ItemTipoConsumoModel>(this.objItemTipoConsumoSelected.filter((tpc: ItemTipoConsumoModel) => tpc.idtipo_consumo === this.idTpcItemResumenSelect)[0]);

      this.item.subitems.map((_subItem: SubItem) => _subItem.selected = false);
      this.item.subitems.filter((_subItem: SubItem) => _subItem.des.toLowerCase().trim() === this.subItemView.des.toLowerCase().trim())[0].selected = true;
      this.item.subitems_selected = [];

      this.miPedidoService.addItem2(_tpc, this.item, 1, this.idTpcItemResumenSelect);
      this.dialogRef.close();
    }
  }

  getCantidadItemCarta(): number {
    return parseInt(this.miPedidoService.findItemCarta(this.item).cantidad.toString(), 0);
  }

  cerrarDlg(): void {
    this.dialogRef.close();
  }

}
