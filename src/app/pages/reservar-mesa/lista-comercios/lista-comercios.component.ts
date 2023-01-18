import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { Router } from '@angular/router';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthServiceSotrage } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-lista-comercios',
  templateUrl: './lista-comercios.component.html',
  styleUrls: ['./lista-comercios.component.css']
})
export class ListaComerciosComponent implements OnInit {

  loaderPage = false;
  ciudadSeleted: any;
  listEstablecimientos: any;
  infoClient: SocketClientModel;

  private veryfyClient: Subscription = null;

  showListComercios = false;


  constructor(
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private verifyClientService: VerifyAuthClientService,
    private establecimientoService: EstablecimientoService,
    private pedidoService: MipedidoService,
    private router: Router,
    private infoToken: InfoTockenService,
    private authService: AuthServiceSotrage,
  ) { }

  ngOnInit(): void {
  }

  selectedCiudad($event: any) {

    this.ciudadSeleted = $event;
    this.loaderPage = true;
    this.loadEstablecimientos();

    this.infoClient = this.verifyClientService.getDataClient();
    this.socketService.connect(this.infoClient, 0, true, false);



  }

  private setInfoToken(token: any): void {
      const _token = `eyCJ9.${btoa(JSON.stringify(token))}`;
      this.authService.setLocalToken(_token);
      this.authService.setLoggedStatus(true);
      this.infoToken.converToJSON();
  }


  loadEstablecimientos() {
    this.loaderPage = true;
    const _data = {
      idsede_categoria: -1,
      codigo_postal: this.ciudadSeleted.ciudad // this.codigo_postal_actual, cambiamos el 310720
    };

    this.listEstablecimientos = [];

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        // setTimeout(() => {
          this.listEstablecimientos = res.data.filter(c => c.pwa_acepta_reservas === 1);
          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            dirEstablecimiento.visible = true;
          });


        setTimeout(() => {
          this.loaderPage = false;
          this.showListComercios = true;
        }, 500);
      });
  }

  itemSelected($event: DeliveryEstablecimiento) {

    this.loaderPage = true;
    this.socketService.closeConnection();

    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(false);
    this.verifyClientService.setIsReserva(true);
    this.verifyClientService.setDataClient();

    // console.log('establecimiento selected', $event);
    this.establecimientoService.set($event);

    // restcarta
    this.pedidoService.resetAllNewPedido();

    // console.log('verifyClient from lista comercios');
    this.veryfyClient = this.verifyClientService.verifyClient()
    .subscribe(res => {
      if ( !res ) {return; }
        this.setInfoToken(res);
        this.infoToken.converToJSON();
        this.infoToken.infoUsToken.isReserva = true;
        this.infoToken.infoUsToken.isDelivery = false;

        this.infoToken.set();
        // this.router.navigate(['../callback-auth']);
        this.loaderPage = false;
        this.router.navigate(['./pedido']);
    });


  }

}
