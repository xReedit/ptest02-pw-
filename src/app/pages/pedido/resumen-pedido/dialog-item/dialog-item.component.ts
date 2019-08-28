import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ItemModel } from 'src/app/modelos/item.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { SeccionModel } from 'src/app/modelos/seccion.model';

@Component({
  selector: 'app-dialog-item',
  templateUrl: './dialog-item.component.html',
  styleUrls: ['./dialog-item.component.css']
})
export class DialogItemComponent implements OnInit {

  item: ItemModel;
  objItemTipoConsumoSelected: ItemTipoConsumoModel[];

  constructor(
    private miPedidoService: MipedidoService,
    private dialogRef: MatDialogRef<DialogItemComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  )  {
    this.item = data.item;
    this.objItemTipoConsumoSelected = <ItemTipoConsumoModel[]>data.objItemTipoConsumoSelected;

    this.miPedidoService.setObjSeccionSeleced(data.seccion);
    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    this.miPedidoService.listenChangeCantItem();
  }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }

  addItemToPedido(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    this.miPedidoService.addItem2(tpcSelect, this.item, suma);
  }


}
