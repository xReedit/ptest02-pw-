import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-ordenes',
  templateUrl: './mis-ordenes.component.html',
  styleUrls: ['./mis-ordenes.component.css']
})
export class MisOrdenesComponent implements OnInit, OnDestroy {
  loaderPage = true;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  infoUser: UsuarioTokenModel;
  listMisPedidos: any = [];
  cargaFallida = false;
  sinSesion = false; // visitante sin cliente identificado: no se consulta al servidor

  idClientePedidos: number;

  telefonoSoporte = '934746830';

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private crudService: CrudHttpService,
    private socketSerrvice: SocketService,
    private router: Router,
  ) { }

  ngOnInit() {

    // el id puede estar solo en el storage, solo en el token o solo en la sesion propia del cliente
    this.idClientePedidos = Number(this.infoTokenService.getIdCliente() || this.infoTokenService.infoUsToken?.idcliente || this.verifyClientService.getDataClient()?.idcliente || 0);
    if ( this.idClientePedidos > 0 ) {
      this.conectServices();
      return;
    }

    this.infoTokenService.getInfoUs();

    if ( this.infoTokenService.infoUsToken ) {
      this.infoUser = this.infoTokenService.infoUsToken;
      this.idClientePedidos = this.infoUser.idcliente;
      this.conectServices();
    } else {
      this.verifyClientService.verifyClient()
      .subscribe(res => {
        this.infoUser = res;
        this.infoTokenService.infoUsToken = res;
        this.infoTokenService.set();
        this.infoTokenService.converToJSON();
        this.idClientePedidos = this.infoUser?.idcliente;
        this.conectServices();
      });
    }
  }

  // sin idcliente el backend responde 400 y salia el boton de reintento: mejor invitar a entrar
  private get haySesionCliente(): boolean {
    return Number(this.idClientePedidos) > 0;
  }

  irALogin(): void {
    // como en registarDirCliente: sin la marca de delivery el guard del login rechaza la ruta
    this.verifyClientService.setIsDelivery(true);
    this.router.navigate(['/login-client']);
  }

  private conectServices() {
    // this.socketSerrvice.connect(this.infoUser, 0, true);

    if ( !this.haySesionCliente ) {
      this.sinSesion = true;
      this.cargaFallida = false;
      this.loaderPage = false;
      return;
    }

    this.sinSesion = false;
    this.loadMisPedidos();
    this.listenChangeStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private listenChangeStatus(): void {

    this.socketSerrvice.onDeliveryPedidoChangeStatus()
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      // console.log('socket listen onDeliveryPedidoChangeStatus', res);
      this.loadMisPedidos();
    });
  }

  loadMisPedidos(): void {
    this.loaderPage = false;
    const _data = {
      idcliente: this.idClientePedidos
    };

    this.listMisPedidos = [];
    this.crudService.postFree(_data, 'delivery', 'get-mis-pedidos', false)
      .subscribe( res => {
        // console.log(res);
        // Una lista vacia no es un error: solo `success === false` o un fallo HTTP lo son.
        if ( !res.success ) { this.cargaFallida = true; return; }
        this.cargaFallida = false;
        this.listMisPedidos = res.data;
        this.listMisPedidos.map( x => {
          x.arrDatosDelivery = JSON.parse(x.arrDatosDelivery);
          x.direccionEnvioSelected = JSON.parse(x.direccionEnvioSelected);

          switch (x.pwa_delivery_status) {
            case '0':
                x.estado = 'Preparando';
              break;
            case '1':
                x.estado = 'Asignado y preparando';
              break;
            case '3':
                x.estado = 'En Camino';
              break;
            case '4':
                x.estado = 'Entregado';
              break;
          }

          return x;
        });



        setTimeout(() => {
          this.loaderPage = false;
        }, 500);
      }, error => {
        console.error('Error al cargar mis pedidos', error);
        this.cargaFallida = true;
        this.loaderPage = false;
      });
  }

  openDetalle(item: any) {

    this.infoTokenService.setOtro(item);
    this.router.navigate(['/zona-delivery/pedido-detalle']);
  }

  redirectWhatsAppSoporte() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.telefonoSoporte}`;
    window.open(_link, '_blank');
  }

  recargarLista() {
    window.location.reload();
  }

}
