import { Component, OnInit } from '@angular/core';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { EstadoPedidoClienteService } from 'src/app/shared/services/estado-pedido-cliente.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

@Component({
  selector: 'app-estado-pedido',
  templateUrl: './estado-pedido.component.html',
  styleUrls: ['./estado-pedido.component.css']
})
export class EstadoPedidoComponent implements OnInit {
  estadoPedido: EstadoPedidoModel;
  infoToken: UsuarioTokenModel;
  tiempoEspera: number;

  constructor(
    private listenStatusService: ListenStatusService,
    private estadoPedidoClienteService: EstadoPedidoClienteService,
    private infoTokenService: InfoTockenService,
    private navigatorService: NavigatorLinkService
  ) { }

  ngOnInit() {

    // verificar en el localstorage
    this.infoToken = this.infoTokenService.getInfoUs();
    this.estadoPedidoClienteService.get();


    // escuchar cambios
    this.listenStatus();

  }

  private listenStatus(): void {
    this.listenStatusService.estadoPedido$.subscribe(res => {
      this.estadoPedido = res;
      console.log('desde estado pedido', this.estadoPedido);
    });

    // tiempo de espera
    this.estadoPedidoClienteService.timeRestanteAprox$.subscribe((res: any) => {
      this.tiempoEspera = res;
      console.log('this.tiempoEspera', this.tiempoEspera);
    });
  }

  verCuenta() {
    console.log('ver al cuenta desde estado');
    this.estadoPedidoClienteService.getCuenta();
    this.navigatorService.setPageActive('mipedido');
  }

}
