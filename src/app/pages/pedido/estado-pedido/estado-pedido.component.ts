import { Component, OnInit, OnDestroy } from '@angular/core';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-estado-pedido',
  templateUrl: './estado-pedido.component.html',
  styleUrls: ['./estado-pedido.component.css']
})
export class EstadoPedidoComponent implements OnInit, OnDestroy {
  estadoPedido: EstadoPedidoModel;
  infoToken: UsuarioTokenModel;
  tiempoEspera: number;

  private unsubscribeEstado = new Subscription();

  constructor(
    private listenStatusService: ListenStatusService,
    private estadoPedidoClienteService: EstadoPedidoClienteService,
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService
  ) { }

  ngOnInit() {

    // verificar en el localstorage
    this.infoToken = this.infoTokenService.getInfoUs();
    this.estadoPedidoClienteService.get();


    // escuchar cambios
    this.listenStatus();

  }

  ngOnDestroy(): void {
    this.unsubscribeEstado.unsubscribe();
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
  }

  private listenStatus(): void {
    this.unsubscribeEstado = this.listenStatusService.estadoPedido$.subscribe(res => {
      this.estadoPedido = res;
      console.log('desde estado pedido', this.estadoPedido);

      // if ( _importe === 0 ) {
      if ( this.estadoPedido.importe === 0 && this.estadoPedido.isRegisterOnePago ) {
        this.unsubscribeEstado.unsubscribe();
        this.estadoPedidoClienteService.setisRegisterPago(false);
        this.navigatorService._router('../lanzar-encuesta');
      }

      // recalcular cuenta si es 0 agradecimiento y lanzar encuesta si aun no la lleno
      // if (this.estadoPedido.isPagada) {
      //   this.navigatorService._router('../lanzar-encuesta');
      // }
    });

    // tiempo de espera
    this.estadoPedidoClienteService.timeRestanteAprox$.subscribe((res: any) => {
      this.tiempoEspera = res;
      console.log('this.tiempoEspera', this.tiempoEspera);
    });

    this.socketService.onPedidoPagado().subscribe(res => {
      console.log('notificado de pago recalcular', res);
      // recalcular cuenta si es 0 agradecimiento y lanzar encuesta si aun no la lleno
      this.estadoPedidoClienteService.getCuentaTotales();
      this.estadoPedidoClienteService.setisRegisterPago(true);
    });
  }

  verCuenta() {
    console.log('ver al cuenta desde estado');
    this.estadoPedidoClienteService.getCuenta();
    this.navigatorService.setPageActive('mipedido');
  }

  pagarCuenta() {
    // this.navigatorService._router('./pagar-cuenta');
    this.navigatorService._router('../pagar-cuenta');
    this.listenStatusService.setIsPagePagarCuentaShow(true);
  }

}
