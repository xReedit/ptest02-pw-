import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { DialogCalificacionComponent } from 'src/app/componentes/dialog-calificacion/dialog-calificacion.component';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';



@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  infoClient: SocketClientModel;
  nomDireccionCliente = 'Establecer una direccion de entrega';
  isSelectedDireccion = false;

  infoUser: UsuarioTokenModel;

  isClienteLogueado = false;
  showPanelRigth = false;

  listPedidoCalificar = [];
  numComerciosCalificar = 0;
  isShowCalificar = false;

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private dialogDireccion: MatDialog,
    private dialog: MatDialog,
    private listenService: ListenStatusService,
    private router: Router,
    private socketService: SocketService,
    private navigartoService: NavigatorLinkService,
    private establecientoService: EstablecimientoService
    // public ngxService: NgxUiLoaderService
  ) { }

  ngOnInit() {
    // window.history.forward();
    // history.pushState(null, null, document.title);

    this.infoTokenService.converToJSON();
    this.infoClient = this.verifyClientService.getDataClient();
    this.isClienteLogueado = this.infoClient.isCliente;

    // si cliente esta logueado
    if ( this.isClienteLogueado ) {
      this.setDireccion(this.infoClient.direccionEnvioSelected);
      // console.log('this.infoToken', this.infoClient);
      this.socketService.connect(this.infoClient, 0, true);

      this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
        if ( res ) {
          // this.codigo_postal_actual = res.codigo;
          this.setDireccion(res);
        }
      });

    }

    this.loadComerciosXCalificar();


    // if ( this.infoTokenService.infoUsToken ) {
    //   this.infoUser = this.infoTokenService.infoUsToken;
    //   this.socketService.connect(this.infoClient, 0, true);
    // } else {
    //   this.verifyClientService.verifyClient()
    //   .subscribe(res => {
    //     this.infoUser = res;
    //     this.infoTokenService.infoUsToken = res;
    //     this.infoTokenService.set();
    //     this.infoTokenService.converToJSON();
    //     this.socketService.connect(this.infoClient, 0, true);
    //   });
    // }


    // si no hay direccion abre el dialog
    // setTimeout(() => {
    //   if ( !this.isSelectedDireccion ) {
    //     this.openDialogDireccion();
    //   }
    // }, 800);

  }

  // ngOnDestroy(): void {
  //   this.socketService.isSocketOpenReconect = true;
  //   this.socketService.closeConnection();
  // }

  private loadComerciosXCalificar() {
    this.establecientoService.getComerciosXCalifcar(this.infoClient.idcliente)
    .subscribe(res => {
      // console.log(res);
      this.listPedidoCalificar = res;
      this.numComerciosCalificar = this.listPedidoCalificar.length;
      this.isShowCalificar = this.numComerciosCalificar > 0;
    });
  }

  openDialogDireccion() {

    if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('direcion', data);
        this.verifyClientService.setDireccionDeliverySelected(data);
        this.setDireccion(data);
      }
    );
  }

  setDireccion(direccion: DeliveryDireccionCliente) {
    if ( direccion ) {
      this.isSelectedDireccion = true;
      const _direccion = direccion.direccion.split(',');
      this.nomDireccionCliente = _direccion[0] + ' ' + _direccion[1];
      // this.listenService.setChangeDireccionDelivery(direccion);
    }
  }

  clickTab(op: any) {
    // op.index = typeof op === 'number' ? op : op.index;
    // console.log($event);
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
      }
      this.router.navigate([`zona-delivery${goToPage}`]);
      this.showPanelRigth = false;
    // this.router.navigate([goToPage]);
  }

  goBack() {
    // console.log('this.navigartoService.nowUrl', this.navigartoService.nowUrl);

    if ( window.location.href.indexOf('/zona-delivery/establecimientos') > -1 ) {
      this.navigartoService._router('../');
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

  goCalificarComercio(index: number) {
    const _pClaificar = this.listPedidoCalificar[index];
    if ( _pClaificar ) {
      const dataCalificado: DatosCalificadoModel = new DatosCalificadoModel;
      dataCalificado.idcliente = this.infoClient.idcliente;
      dataCalificado.idpedido = _pClaificar.idpedido;
      dataCalificado.idsede = _pClaificar.idsede;
      dataCalificado.tipo = 3;
      dataCalificado.showNombre = true;
      dataCalificado.showTitulo = true;
      dataCalificado.showTxtComentario = true;
      dataCalificado.nombre = _pClaificar.nomestablecimiento;
      dataCalificado.titulo = 'Como calificas al comercio?';
      dataCalificado.showMsjTankyou = true;

    const _dialogConfig = new MatDialogConfig();
      _dialogConfig.disableClose = true;
      _dialogConfig.hasBackdrop = true;

      _dialogConfig.data = {
        dataCalificado: dataCalificado
      };


    const dialogRef =  this.dialog.open(DialogCalificacionComponent, _dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        index++;
        // console.log('index', index);
        this.isShowCalificar = index < this.numComerciosCalificar;
        this.goCalificarComercio(index);
      }
    );
    }
  }

  registarDirCliente() {
    this.verifyClientService.setIsDelivery(true);
    this.router.navigate(['/login-client']);
  }

  cerrarAllSession() {
    localStorage.clear();
  }

}
