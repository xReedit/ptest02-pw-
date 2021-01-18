import { Component, OnInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

@Component({
  selector: 'app-confirmado',
  templateUrl: './confirmado.component.html',
  styleUrls: ['./confirmado.component.css']
})
export class ConfirmadoComponent implements OnInit {

  constructor(
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private miPedidoService: MipedidoService,
  ) { }

  ngOnInit(): void {
    this.navigatorService.disableGoBack();
  }

  finDelivery() {

    // this.lanzarPermisoNotificationPush(0);

    // limpiar storage transaccion
    this.miPedidoService.prepareNewPedido();
    this.infoTokenService.removeStoragePedido();
    // this.infoTokenService.cerrarSession();

    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();

    this.navigatorService._router('../zona-delivery');

  }

}
