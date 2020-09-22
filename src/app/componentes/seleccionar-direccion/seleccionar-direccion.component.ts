import { Component, OnInit, Output, EventEmitter, Input, Inject } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-seleccionar-direccion',
  templateUrl: './seleccionar-direccion.component.html',
  styleUrls: ['./seleccionar-direccion.component.css']
})
export class SeleccionarDireccionComponent implements OnInit {
  private infoClienteLogueado: any;
  listDirecciones: DeliveryDireccionCliente[];

  @Output() direccionSelected = new EventEmitter<DeliveryDireccionCliente>();
  @Input() idClienteBuscar: number; // cuando el pedido lo toma el mismo comercio

  idClienteDirecciones: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit() {
    this.infoClienteLogueado = this.verifyClientService.getDataClient();
    this.idClienteDirecciones = this.idClienteBuscar ? this.idClienteBuscar : this.infoClienteLogueado.idcliente;
    console.log(this.infoClienteLogueado);

    this.loadDireccion();
    // console.log('load direcciones');
  }

  loadDireccion() {
    // si es 0 no cliente nuevo
    this.listDirecciones = [];
    if ( !this.idClienteDirecciones || this.idClienteDirecciones.toString() === '0' ) {return; }


    const _dataClientDir = {
      idcliente : this.idClienteDirecciones
    };

    // console.log(_dataClientDir);

    this.crudService.postFree(_dataClientDir, 'delivery', 'get-direccion-cliente', false)
      .subscribe((res: any) => {
        // console.log('direcciones', res);
        this.listDirecciones = res.data;
        // console.log('this.listDirecciones', this.listDirecciones);

        if ( this.idClienteBuscar ) {return; }

        // si solo hay una direccion selecciona
        // if (this.listDirecciones.length === 1 && this.infoClienteLogueado.direccionEnvioSelected === null ) {
          // this.direccionSelected.emit(this.listDirecciones[0]);
        // }
      });
  }

  selected(item: DeliveryDireccionCliente) {
    this.direccionSelected.emit(item);
  }

}
