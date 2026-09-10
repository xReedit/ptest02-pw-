import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';
import { merge } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';
import { Router } from '@angular/router';
import { SeguimientoPedidoService } from 'src/app/shared/services/seguimiento-pedido.service';
import { resumirEstadoPedido } from 'src/app/shared/utils/estado-pedido';

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
    private router: Router,
    private seguimiento: SeguimientoPedidoService,
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
    // el socket ya lo abre main.component al entrar a la zona delivery

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
    this.destroy$.complete();
  }

  // socket, vuelta al primer plano y polling de respaldo: cualquiera refresca la lista
  // el filtro va ANTES del debounce: sin pedidos activos no se vuelve a consultar al servidor
  // debounceTime va antes de takeUntil: al revés, al destruir el componente el debounce pendiente se vaciaría igual
  private listenChangeStatus(): void {
    merge(this.seguimiento.cambios$(), this.seguimiento.refrescoAutomatico$())
      .pipe(filter(() => (this.listMisPedidos || []).some(x => x.estadoResumen?.activo)), debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.loadMisPedidos(false));
  }

  loadMisPedidos(mostrarLoader = true): void {
    if ( mostrarLoader ) { this.loaderPage = true; }
    const _data = {
      idcliente: this.idClientePedidos
    };

    // no se vacia la lista antes de responder: evita el parpadeo en cada refresco
    this.crudService.postFree(_data, 'delivery', 'get-mis-pedidos', false)
      .pipe(takeUntil(this.destroy$))
      .subscribe( res => {
        this.loaderPage = false;
        // Una lista vacia no es un error: solo `success === false` o un fallo HTTP lo son.
        if ( !res.success ) { this.cargaFallida = true; return; }
        this.cargaFallida = false;
        this.listMisPedidos = (res.data || []).map( x => {
          x.arrDatosDelivery = JSON.parse(x.arrDatosDelivery);
          x.direccionEnvioSelected = JSON.parse(x.direccionEnvioSelected);
          x.estadoResumen = resumirEstadoPedido(x);
          x.estado = x.estadoResumen.etiqueta;
          return x;
        });
      }, error => {
        // se conserva la lista anterior: un fallo de red no debe vaciar la pantalla
        console.error('Error al cargar mis pedidos', error);
        this.cargaFallida = this.listMisPedidos.length === 0;
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
