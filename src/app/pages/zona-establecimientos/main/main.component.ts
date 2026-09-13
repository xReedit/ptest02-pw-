import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { AuthServiceSotrage } from 'src/app/shared/services/auth.service';
import { DialogDireccionClienteDeliveryComponent } from 'src/app/componentes/dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component';
import { AuthNativeService } from 'src/app/shared/services/auth-native.service';
import { IS_PLATAFORM_IOS } from 'src/app/shared/config/config.const';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
import { DialogOutAuthIosComponent } from 'src/app/componentes/dialog-out-auth-ios/dialog-out-auth-ios.component';
import { DireccionEntregaService } from 'src/app/shared/services/direccion-entrega.service';



@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {
  infoClient: SocketClientModel;
  // texto por defecto de la cabecera mientras nadie ha escogido direccion
  readonly TEXTO_SIN_DIRECCION = 'Establecer una direccion de entrega';
  nomDireccionCliente = this.TEXTO_SIN_DIRECCION;
  isSelectedDireccion = false;

  infoUser: UsuarioTokenModel;

  isClienteLogueado = false;
  showPanelRigth = false;
  showSelectedDireccion = false;

  isPlataformIos = IS_PLATAFORM_IOS;

  telefonoSoporte = '934746830';

  // pestaña marcada en la barra inferior; se calcula de la url para que al
  // recargar en /pedidos no quede marcado "Inicio"
  tabActivo = 0;

  private destruir$ = new Subject<void>();

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private dialogDireccion: MatDialog,
    private dialogDireccionClienteDelivery: MatDialog,
    private dialog: MatDialog,
    public listenService: ListenStatusService,
    private router: Router,
    private socketService: SocketService,
    private navigartoService: NavigatorLinkService,
    private authService: AuthServiceSotrage,
    private authNativeService: AuthNativeService,
    private crudService: CrudHttpService,
    private direccionEntrega: DireccionEntregaService
    // public ngxService: NgxUiLoaderService
  ) { }

  ngOnInit() {
    // window.history.forward();
    // history.pushState(null, null, document.title);

    this.tabActivo = this.router.url.indexOf('/pedidos') > -1 ? 1 : 0;

    this.infoTokenService.converToJSON();
    this.infoClient = this.verifyClientService.getDataClient();
    this.isClienteLogueado = this.infoClient.isCliente;
    this.showSelectedDireccion = this.isClienteLogueado;


    // console.log('this.infoClient main', this.infoClient);

    // la direccion de entrega tiene un solo dueño: la cabecera y el cartel de bienvenida
    // se repintan en cuanto cambia, sin recargar y sin depender de estar logueado
    this.direccionEntrega.seleccionada$
      .pipe(takeUntil(this.destruir$))
      .subscribe((direccion: DeliveryDireccionCliente) => this.pintarDireccion(direccion));

    // el bus sigue vivo para quien todavia avisa por el (dialog-select-direccion):
    // lo que llega por ahi se le entrega al dueño, no se escribe a mano
    this.listenService.isChangeDireccionDelivery$
      .pipe(takeUntil(this.destruir$))
      .subscribe((res: DeliveryDireccionCliente) => {
        if ( res ) { this.direccionEntrega.establecer(res); }
      });

    // si cliente esta logueado; la sesion propia del cliente tambien necesita el socket para seguir su pedido
    if (this.isClienteLogueado || this.infoClient.isClienteTmp || this.verifyClientService.isLogin()) {
      this.showSelectedDireccion = true;
      // console.log('this.infoToken', this.infoClient);
      this.socketService.connect(this.infoClient, 0, true);
    }

    // si no hay direccion abre el dialog
    // setTimeout(() => {
    //   if ( !this.isSelectedDireccion ) {
    //     this.openDialogDireccion();
    //   }
    // }, 800);

  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  openDialogDireccion1() {

    // if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('direcion', data);
        this.direccionEntrega.establecer(data);
      }
    );
  }

  openDialogDireccion() {
    // if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    _dialogConfig.data = {
      idcliente : this.infoClient.idcliente
    };

    const dialogDireccionCliente = this.dialogDireccionClienteDelivery.open(DialogDireccionClienteDeliveryComponent, _dialogConfig);
    dialogDireccionCliente.afterClosed().subscribe((data: any) => {
      if ( !data ) { return; }
        // console.log('direcion', data);
        this.infoClient.isClienteTmp = !this.isClienteLogueado;
        this.showSelectedDireccion = true;

        this.verifyClientService.setIsClientTmp(this.infoClient.isClienteTmp)
        // el dueño de la direccion escribe los dos almacenes y avisa a la cabecera
        this.direccionEntrega.establecer(data);

        // console.log('this.infoClient', this.infoClient);
    });

  }

  /** Repinta cabecera y cartel de bienvenida con lo que diga el dueño de la direccion. */
  private pintarDireccion(direccion: DeliveryDireccionCliente) {
    if ( !direccion?.direccion ) {
      this.isSelectedDireccion = false;
      this.nomDireccionCliente = this.TEXTO_SIN_DIRECCION;
      this.showSelectedDireccion = this.isClienteLogueado;
      return;
    }

    this.isSelectedDireccion = true;
    this.showSelectedDireccion = true;

    let _direccion: any;
    try {
      _direccion = direccion?.direccion.split(',') || '';
    } catch (error) {
      console.error('error split', error);
    }
    this.nomDireccionCliente = _direccion + ' ' + direccion.ciudad;
    this.listenService.setChangeDireccionDelivery(direccion);
  }

  clickTab(op: any) {
    // op.index = typeof op === 'number' ? op : op.index;
    let goToPage = '/establecimientos';
    // const index = $event.index ? $event.index : $event;
    switch (op) {
      case 0:
        goToPage = '/establecimientos';
        break;
      case 1:
        goToPage = '/pedidos';
        // this.router.navigate(['/mis-pedidos']);
        break;
      case 2: // soporte
        this.redirectWhatsAppSoporte();
        return;
        break;
      }
      this.router.navigate([`zona-delivery${goToPage}`]);
      this.showPanelRigth = false;
    // this.router.navigate([goToPage]);
  }

  redirectWhatsAppSoporte() {
    const _link = `https://api.whatsapp.com/send?phone=51${this.telefonoSoporte}`;
    window.open(_link, '_blank');
  }

  goBack() {


    if ( window.location.href.indexOf('/zona-delivery/establecimientos') > -1 ) {
      this.navigartoService.__router('../');
      return;
    }

    if ( window.location.href.indexOf('/zona-delivery/categorias') > -1 ) {
      this.navigartoService._router('/zona-delivery/establecimientos');
      return;
    }

    if ( window.location.href.indexOf('/zona-delivery/pedido-detalle') > -1 ) {
      this.navigartoService._router('/zona-delivery/pedidos');
      return;
    }

    window.history.back();
  }

  registarDirCliente() {
    this.verifyClientService.setIsDelivery(true);
    this.router.navigate(['/login-client']);
  }

  cerrarAllSession() {    
    this.authService.loggedOutUser();
    this.authService.setLocalToken('');
    this.authNativeService.logout()
    localStorage.clear();
    this.router.navigate(['../']);
    window.location.reload();
  }

  eliminarCuentaUsuario() {

    // const _dialogConfig = new MatDialogConfig();
    // _dialogConfig.disableClose = true;
    // _dialogConfig.hasBackdrop = true;
    // _dialogConfig.data = { idMjs: 3, titleBtnSuccess: 'Si'};

    const dialogRef = this.dialog.open(DialogOutAuthIosComponent);
    dialogRef.afterClosed().subscribe(
      data => {
        if (!data) { return; }

        const _data = {
          user: this.infoClient
        }
    
        this.crudService.postFree(_data,'ini', 'user-account-remove', false)
        .subscribe(res => {
          this.cerrarAllSession()          
        })
      }
    );

  }

}
