import { Component, OnInit } from '@angular/core';
// import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { Router } from '@angular/router';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';

@Component({
  selector: 'app-seleccionar-ubicacion-delivery',
  templateUrl: './seleccionar-ubicacion-delivery.component.html',
  styleUrls: ['./seleccionar-ubicacion-delivery.component.css']
})
export class SeleccionarUbicacionDeliveryComponent implements OnInit {
  isFormValid = false;
  loader = 0;
  private dataCliente: any;
  // private infoClienteLogueado;

  constructor(
    private router: Router,
    private verifyClientService: VerifyAuthClientService,
    // private crudService: CrudHttpService,
  ) { }

  ngOnInit() {

  }

  setDireccion($event: DeliveryDireccionCliente) {

    // guardar en infotoken
    this.verifyClientService.setDireccionDeliverySelected($event);
    // enviar a zona de establecimientos
    this.goZonaEstablecimiento();
  }

  private goZonaEstablecimiento() {
    this.router.navigate(['/zona-delivery']);
  }

}
