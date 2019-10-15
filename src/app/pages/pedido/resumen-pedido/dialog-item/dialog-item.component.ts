import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';


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
    this.miPedidoService.addItem2(tpcSelect, this.item, suma, this.idTpcItemResumenSelect);
  }


}
