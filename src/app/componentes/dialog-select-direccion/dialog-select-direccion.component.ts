import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-dialog-select-direccion',
  templateUrl: './dialog-select-direccion.component.html',
  styleUrls: ['./dialog-select-direccion.component.css']
})
export class DialogSelectDireccionComponent implements OnInit {

  isShowAddDireccion = false;
  direccionSelected: DeliveryDireccionCliente;

  isGuardarDireccion = true;

  _idClienteBuscar: number; // cuando el pedido delivery lo toma el comercio

  private fromComercio = false;

  constructor(
    private dialogRef: MatDialogRef<DialogSelectDireccionComponent>,
    private listenService: ListenStatusService,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.isGuardarDireccion = data ? data.isGuardar : true;
    this._idClienteBuscar = data ? data.idClienteBuscar : null;
    this.fromComercio = data ? data?.fromComercio || false : false;
  }

  ngOnInit() {
  }

  setDireccion($event: DeliveryDireccionCliente) {

    this.direccionSelected = $event;

    this.listenService.setChangeDireccionDelivery(this.direccionSelected);
    this.cerrarDlg();
  }

  showAddDireccion() {
    this.isShowAddDireccion = true;
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.direccionSelected);
  }

}
