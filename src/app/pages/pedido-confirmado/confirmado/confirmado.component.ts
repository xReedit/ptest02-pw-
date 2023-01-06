import { Component, OnInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';

@Component({
  selector: 'app-confirmado',
  templateUrl: './confirmado.component.html',
  styleUrls: ['./confirmado.component.css']
})
export class ConfirmadoComponent implements OnInit {

  titulo = 'Pedido Confirmado';
  subtitulo = 'Su orden llegara pronto.';
  img = 'food_delivery.gif';
  isReservaCliente = false;

  constructor(
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private router: Router,
    private socketService: SocketService,
    private miPedidoService: MipedidoService,
    private dialog: MatDialog,
    private pushNotificationSerice: NotificacionPushService,
    private utilitariosSerivce: UtilitariosService
  ) { }

  ngOnInit(): void {
    this.navigatorService.disableGoBack();
    this.navigatorService.setOffListenNavigator(true);

    this.isReservaCliente = this.infoTokenService.infoUsToken.isReserva;

    if ( this.isReservaCliente ) {
      this.titulo = 'Reserva Confirmada';
      this.subtitulo = 'Su reserva esta hecha. Lo esperamos a la hora que indico.';
      this.img = 'icon-app/reserva.JPG';
    }
  }

  finDeliveryAvisoMsj() {

    if ( this.utilitariosSerivce.getOS() !== 'iOS' ) {
      this.lanzarPermisoNotificationPush(0);
    }

    // limpiar storage transaccion
    this.miPedidoService.prepareNewPedido();
    this.infoTokenService.removeStoragePedido();
    this.infoTokenService.setIdCliente();
    // this.infoTokenService.cerrarSession();

    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
    this.navigatorService.cerrarSession();


    // this.navigatorService._router('../zona-delivery');
    // this.router.navigate(['./home']);

  }


  private lanzarPermisoNotificationPush(option: number = 0) {
    // this.pushNotificationSerice.suscribirse(option);

    console.log('aaaaaaaaaaaaaaaaaaaaaaa');
    if ( this.pushNotificationSerice.getIsTienePermiso() ) {
      this.pushNotificationSerice.suscribirse();
      return;
    }
    // else {
    //   this.pushNotificationSerice.suscribirse();
    //   return;
    // }

    // si no tiene permiso le pregunta
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.data = {idMjs: option};

    const _dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
    _dialogReset.afterClosed().subscribe(result => {
      if ( result ) {
        // console.log('result', result);
        this.pushNotificationSerice.suscribirse();
      }
    });
  }

}
