import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';

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
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit() {
    this.infoClienteLogueado = this.verifyClientService.getDataClient();
    this.idClienteDirecciones = this.idClienteBuscar ? this.idClienteBuscar : this.infoClienteLogueado.idcliente;
    // console.log(this.infoClienteLogueado);

    this.loadDireccion();
  }

  loadDireccion() {
    // si es 0 no cliente nuevo
    if ( this.idClienteDirecciones.toString() === '0' ) {return; }


    const _dataClientDir = {
      idcliente : this.idClienteDirecciones
    };

    // console.log(_dataClientDir);

    this.crudService.postFree(_dataClientDir, 'delivery', 'get-direccion-cliente', false)
      .subscribe((res: any) => {
        console.log('direcciones', res);
        this.listDirecciones = res.data;

        if ( this.idClienteBuscar ) {return; }
        // si solo hay una direccion selecciona
        if (this.listDirecciones.length === 1 && this.infoClienteLogueado.direccionEnvioSelected === null ) {
          this.direccionSelected.emit(this.listDirecciones[0]);
        }
      });
  }

  selected(item: DeliveryDireccionCliente) {
    this.direccionSelected.emit(item);
  }

}
