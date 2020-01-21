import { Component, OnInit } from '@angular/core';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { SocketService } from 'src/app/shared/services/socket.service';
// import * as botonPago from 'src/assets/js/boton-pago.js';

declare const pagar: any;

@Component({
  selector: 'app-pagar-cuenta',
  templateUrl: './pagar-cuenta.component.html',
  styleUrls: ['./pagar-cuenta.component.css']
})
export class PagarCuentaComponent implements OnInit {
  estadoPedido: EstadoPedidoModel;
  infoToken: UsuarioTokenModel;
  importe: number;
  isLoaderTransaction = false;
  dataResTransaction: any = null;

  private listenKeyLoader = 'sys::transaction-load';
  private listenKeyData = 'sys::transaction-response';
  private timeListenerKeys: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private listenStatusService: ListenStatusService,
    private estadoPedidoClienteService: EstadoPedidoClienteService,
    private socketService: SocketService,
  ) { }

  ngOnInit() {
    this.navigatorService.disableGoBack();
    this.infoToken = this.infoTokenService.getInfoUs();
    this.importe = this.estadoPedidoClienteService.getCuenta();

    console.log(this.infoToken);
    console.log(this.importe);
  }

  goPagar() {
    pagar();
    this.listenResponse();
  }

  goBack() {
    this.navigatorService.disabledBack = false;
    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
    this.navigatorService._router('../pedido');
    // this.listenStatusService.setIsPagePagarCuentaShow(false);
  }

  generarPsuhNumber() {

  }

  private listenResponse() {
    this.timeListenerKeys = setTimeout(() => {
      const dataResponse = localStorage.getItem(this.listenKeyData);
      this.isLoaderTransaction = localStorage.getItem(this.listenKeyLoader) === '0' ? false : true;

      if ( dataResponse !== 'null' ) {
        console.log('dataResponse', dataResponse);
        this.dataResTransaction = JSON.parse(dataResponse);
      } else {
        this.listenResponse();
      }
    }, 100);
  }



}
