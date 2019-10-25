import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { SubItem } from 'src/app/modelos/subitems.model';


@Component({
  selector: 'app-dialog-item',
  templateUrl: './dialog-item.component.html',
  styleUrls: ['./dialog-item.component.css', '../../pedido.style.css']
})
export class DialogItemComponent implements OnInit {
  idTpcItemResumenSelect: number;
  item: ItemModel;
  objItemTipoConsumoSelected: ItemTipoConsumoModel[];

  constructor(
    public miPedidoService: MipedidoService,
    private dialogRef: MatDialogRef<DialogItemComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  )  {
    this.idTpcItemResumenSelect = data.idTpcItemResumenSelect;
    this.item = data.item;
    this.item.cantidad = this.getCantidadItemCarta(); // trae el stock del item carta
    this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>data.objItemTipoConsumoSelected;

    this.miPedidoService.setObjSeccionSeleced(data.seccion);
    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    this.miPedidoService.listenChangeCantItem();
  }

  ngOnInit() {
    // listen cambios en el stock
    this.miPedidoService.itemStockChangeObserve$.subscribe((res: ItemModel) => {
      if ( this.item.iditem === res.iditem ) {
        this.item.cantidad = res.cantidad;
      }
    });

    this.item.subitems_selected = null;
    this.item.subitems_view = null;
    this.item.subitems.map((sub: SubItem) => sub.selected = false);

  }

  getCantidadItemCarta(): number {
    return parseInt(this.miPedidoService.findItemCarta(this.item).cantidad.toString(), 0);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }

  addItemToPedido(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    console.log('restar desde dialogitem');
    this.miPedidoService.addItem2(tpcSelect, this.item, suma);
  }

  addSubItem(subitem: SubItem): void {
    // subitem.selected = !subitem.selected;

    // if ( subitem.selected ) {
      const listSubItemChecked = this.item.subitems.filter((x: SubItem) => x.selected);
      let countSelectReq = listSubItemChecked.length;

      // adicional el importe al precio del item
      this.item.precio = this.item.precio_unitario + subitem.precio;
      // this.itemSelected.precio_total = parseFloat(this.itemSelected.precio);


      listSubItemChecked.map( (_subItem: SubItem, i: number) =>  {
        if (countSelectReq > this.item.subitem_cant_select && _subItem !== subitem) {
          _subItem.selected = false;
          countSelectReq--;
        }
      });
    // }
  }

}
