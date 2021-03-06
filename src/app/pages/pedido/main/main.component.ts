import { Component, OnInit, HostListener } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  isVisibleToolBar = true;
  isBusqueda = false;
  isHayCuentaBusqueda = false;
  countTotalItems = 0;
  selectedTab = 0;
  isUsuarioCliente = false; // si es usuario cliente
  isClienteDelivery = false;
  isClienteReserva = false;
  isPagePagarShow = false;


  private lastValScrollTop = 0;
  importeTotalProductos = 0;


  // tamaño de la pamtalla
  isScreenIsMobile = true;
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.detectScreenSize();
  }

  constructor(
    private miPedidoService: MipedidoService,
    private navigatorService: NavigatorLinkService,
    public listenStatusService: ListenStatusService,
    public socketService: SocketService,
    private verifyClientService: VerifyAuthClientService,
    private infoTokenService: InfoTockenService
    ) {
    }

  private detectScreenSize() {
    this.isScreenIsMobile = window.innerWidth > 1049 ? false : true;
    // console.log('window.innerWidth', window.innerWidth);
    // console.log('this.isScreenIsMobile', this.isScreenIsMobile);
  }

  ngOnInit() {
    this.detectScreenSize();
    this.socketService.isSocketOpenReconect = false;
    this.navigatorService.setPageActive('carta');

    this.infoTokenService.getInfoUs();
    // this.navigatorService.addLink('carta');

    // console.log('pedido main verifyClient');
    this.verifyClientService.verifyClient().subscribe((res: SocketClientModel) => {
      // console.log('desde incio', res);
      if ( !res ) { this.isUsuarioCliente = this.infoTokenService.infoUsToken.isCliente; } else {
        this.isUsuarioCliente = res.isCliente || false;
      }
      this.listenStatusService.setIsUsuarioCliente(this.isUsuarioCliente);
      this.isClienteDelivery = res?.isDelivery;
      this.isClienteReserva = res?.isReserva;

      // para que reconecte, porque al iniciar no conecta si viene delivery codigo qr
      if (this.verifyClientService.getIsDelivery() && this.verifyClientService.getIsQrSuccess()) {
        this.socketService.isSocketOpen = false;
      }
    });

    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
    });

    this.listenStatusService.hayCuentaBusqueda$.subscribe(res => {
      this.isHayCuentaBusqueda = res;
    });

    this.listenStatusService.isPagePagarCuentaShow$.subscribe(res => {
      this.isPagePagarShow = res;
    });

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      switch (res.pageActive) {
        case 'carta':
          this.selectedTab = 0;
          this.resetObjCuenta();
          // console.log(this.selectedTab);
          break;
        case 'estado':
          this.selectedTab = 2;
          break;
        case 'mipedido':
          this.selectedTab = 1;
          break;
      }

      // if (res.pageActive === 'carta') {
      //   this.selectedTab = 0;
      //   this.resetObjCuenta();
      //   console.log(this.selectedTab);
      // }

    });

    this.miPedidoService.countItemsObserve$.subscribe((res) => {
      this.countTotalItems = res;
      this.importeTotalProductos = this.miPedidoService.getSubTotalMiPedido();
    });

    // this.tooltip.show();
    // setTimeout(() => {
    //   // this._matTooltip.position = 'below';
    //   // this._matTooltip.tooltipClass = 'example-tooltip-red-1';
    //   this._matTooltip.show();
    // }, 1000);
  }

  onScroll($event: any): void {
    const val = $event.srcElement.scrollTop;
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 0 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }

  clickTab($event: any) {



    console.log('event tab', $event);
    this.selectedTab = $event.index;

    // if ( this.selectedTab === 1 && !this.isScreenIsMobile ) {return false; }

    const _pageActive = $event.tab.textLabel.toLowerCase();
    this.navigatorService.setPageActive(_pageActive);
    // $event.srcElement.scrollTop = 0;
    this.isVisibleToolBar = true;
    // this.navigatorService.restorePage(_pageActive);
  }

  private resetObjCuenta(): void {
    if ( !this.isHayCuentaBusqueda ) { return; }
    this.miPedidoService.resetObjMiPedido();
    this.listenStatusService.setHayCuentaBuesqueda(false);
  }

  goListaProductos() {
    const _tabList = {
      index: 1,
      tab: {
        isActive: true,
        origin: 1,
        position: 0,
        textLabel: 'MiPedido'
      }
    };

    this.clickTab(_tabList);
  }
}
