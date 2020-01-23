import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { SocketService } from 'src/app/shared/services/socket.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { ClientePagoModel } from 'src/app/modelos/cliente.pago.model';
import { RegistrarPagoService } from 'src/app/shared/services/registrar-pago.service';

// import * as botonPago from 'src/assets/js/boton-pago.js';

declare const pagar: any;

@Component({
  selector: 'app-pagar-cuenta',
  templateUrl: './pagar-cuenta.component.html',
  styleUrls: ['./pagar-cuenta.component.css']
})
export class PagarCuentaComponent implements OnInit, OnDestroy {
  estadoPedido: EstadoPedidoModel;
  infoToken: UsuarioTokenModel;
  // socketClient: SocketClientModel;
  importe: number;
  isLoaderTransaction = false;
  isLoadBtnPago = false;
  isCheckTerminos = false;
  isTrasctionSuccess = false;
  isViewAlertTerminos = false;
  dataResTransaction: any = null;

  countFin = 5;
  private intervalConteo = null;

  fechaTransaction = new Date();

  private listenKeyLoader = 'sys::transaction-load';
  private listenKeyData = 'sys::transaction-response';
  private timeListenerKeys: any;
  private unsubscribeEstado = new Subscription();

  private dataClientePago: ClientePagoModel = new ClientePagoModel();

  constructor(
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private listenStatusService: ListenStatusService,
    private estadoPedidoClienteService: EstadoPedidoClienteService,
    private socketService: SocketService,
    private crudService: CrudHttpService,
    private registrarPagoService: RegistrarPagoService,
    // private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit() {
    this.navigatorService.disableGoBack();
    this.infoToken = this.infoTokenService.getInfoUs();
    this.estadoPedidoClienteService.get();
    // this.socketClient = this.verifyClientService.getDataClient();
    this.listener();
    this.getEmailCliente();

    // console.log(this.infoToken);
    // console.log(this.importe);
    // console.log('cliente socket verify', this.socketClient);
  }

  ngOnDestroy(): void {
    this.unsubscribeEstado.unsubscribe();
  }

  private listener() {
    this.unsubscribeEstado = this.listenStatusService.estadoPedido$.subscribe(res => {
      this.estadoPedido = res;
    });
  }

  // obtener datos del cliente
  private getEmailCliente(): void {
    const dataClient = {
      id: this.infoToken.idcliente
    };
    this.crudService.postFree(dataClient, 'transaction', 'get-email-client', false).subscribe((res: any) => {
      this.dataClientePago.email = res.data.email ? res.data.email : '';
      this.dataClientePago.nombres = this.infoToken.nombres;
      this.getNomApClientePago(this.dataClientePago.nombres);
    });
  }

  // dividi nombre y apellidos
  private getNomApClientePago(nombres: string): void {
    const _names = nombres.split(' ');
    let nameCliente = '';
    let apPaternoCliente = '';
    switch (_names.length) {
      case 1:
        nameCliente = _names[0];
        break;
      case 2:
        nameCliente = _names[0];
        apPaternoCliente = _names[1];
        break;
      case 3:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
      case 4:
        nameCliente = _names[0];
        apPaternoCliente = _names[2];
        break;
    }

    this.dataClientePago.nombre = nameCliente;
    this.dataClientePago.apellido = apPaternoCliente;

    console.log('data cleinte pago', this.dataClientePago);

  }

  goPagar() {
    this.isCheckTerminos = true;
    this.isLoadBtnPago = true;
    this.generarPurchasenumber();
  }

  goBack() {
    this.navigatorService.disabledBack = false;
    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
    this.navigatorService._router('../pedido');
    // this.listenStatusService.setIsPagePagarCuentaShow(false);
  }

  generarPurchasenumber() {
    this.crudService.getAll('transaction', 'get-purchasenumber', false, false, false).subscribe((res: any) => {
      const _purchasenumber = res.data[0].purchasenumber;

      pagar(this.estadoPedido.importe, _purchasenumber, this.dataClientePago);
      this.listenResponse();
      this.verificarCheckTerminos();

      this.listenStatusService.setIsBtnPagoShow(true);
    });

  }

  private listenResponse() {
    this.timeListenerKeys = setTimeout(() => {
      const dataResponse = localStorage.getItem(this.listenKeyData);
      this.isLoaderTransaction = localStorage.getItem(this.listenKeyLoader) === '0' ? false : true;

      if ( dataResponse !== 'null' ) {
        this.isLoadBtnPago = false;
        console.log('dataResponse', dataResponse);
        this.dataResTransaction = JSON.parse(dataResponse);

        this.isTrasctionSuccess = !this.dataResTransaction.error;

        if (this.isTrasctionSuccess) {
          // registrar pago
          this.registrarPagoService.registrarPago(this.estadoPedido.importe.toString());
          // cuenta para cerrar
          this.cuentaRegresiva();
        }

      } else {
        this.listenResponse();
      }
    }, 100);
  }

  verificarCheckTerminos() {
    this.isViewAlertTerminos = this.isCheckTerminos ? false : true;
  }

  private cuentaRegresiva() {
    if ( this.countFin <= 0 ) {
      this.intervalConteo = null;
      this.actionAfterTransaction();
    } else {
      this.conteoFinEncuesta();
    }
  }

  private conteoFinEncuesta(): void {
    this.intervalConteo =  setTimeout(() => {
      this.countFin --;
      this.cuentaRegresiva();
    }, 1000);
  }

  private actionAfterTransaction(): void {
    if ( this.dataResTransaction.error ) {
      this.navigatorService._router('../pedido');
    } else {
      this.navigatorService._router('../lanzar-encuesta');
    }
  }



}
