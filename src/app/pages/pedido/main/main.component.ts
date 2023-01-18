import { Component, OnInit, HostListener } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { ComandAnalizerService } from 'src/app/shared/services/speech/comand-analizer.service';

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
  isPuntoAutoPedido = false;
  loaderPage = false;
  timeLoader = null;
  isSpeechVoiceAcivado = false;


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
    private infoTokenService: InfoTockenService,
    // private comandAnalizerService: ComandAnalizerService,
    private establecimientoService: EstablecimientoService,
    ) {
      // console.log('verifyClientService', this.verifyClientService.get);
      // this.comandAnalizerService.getIsActive();
      // this.comandAnalizerService.getComands();
    }

  private detectScreenSize() {
    this.isScreenIsMobile = window.innerWidth > 1049 ? false : true;
    // console.log('window.innerWidth', window.innerWidth);
    // console.log('this.isScreenIsMobile', this.isScreenIsMobile);
  }

  ngOnInit() {

    // console.log('this.infoTokenService.getInfoUs()', this.infoTokenService.getInfoUs());
    this.detectScreenSize();
    this.socketService.isSocketOpenReconect = false;
    this.navigatorService.setPageActive('carta');


    this.infoTokenService.getInfoUs();
    this.isPuntoAutoPedido = this.infoTokenService.isPuntoAutoPedido();
    this.isSpeechVoiceAcivado = this.establecimientoService.get().speech_disabled === 1;
    // this.navigatorService.addLink('carta');

    // console.log('this.infoTokenService.infoUsToken', this.infoTokenService.infoUsToken);
    // console.log('pedido main verifyClient');
    // console.log('verifyClient from main pedido');
    this.verifyClientService.verifyClient().subscribe((res: SocketClientModel) => {
      // console.log('desde main pedido', res);
      // console.log('this.infoTokenService', this.infoTokenService);
      if ( !res ) { this.isUsuarioCliente = this.infoTokenService.infoUsToken.isCliente; } else {
        this.isUsuarioCliente = res.isCliente || false;
      }
      this.listenStatusService.setIsUsuarioCliente(this.isUsuarioCliente);
      this.isClienteDelivery = res?.isDelivery;
      this.isClienteReserva = res?.isReserva;

      // -----------------> ACTIVAR MOZO VIRTUAL
      // 250122 quitamos speech x mejorar
      // const _isActiveMozoVoz =  this.isSpeechVoiceAcivado && this.isUsuarioCliente && !this.isClienteDelivery;
      // console.log('_isActiveMozoVoz', _isActiveMozoVoz);
      // this.infoTokenService.setIsAvtiveMozoVoz(_isActiveMozoVoz);

      // if ( _isActiveMozoVoz ) {
      //   this.comandAnalizerService.getComands();
      //   setTimeout(() => {
      //     this.comandAnalizerService.cocinarComand('bienvenido');
      //   }, 700);
      // }
      // -----------------> ACTIVAR MOZO VIRTUAL

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

    this.listenStatusService.isFinishLoaderSendPedido$.subscribe((isOpen: boolean) => {
      if ( isOpen === true && !this.isUsuarioCliente ) {
        setTimeout(() => {
          this.closeMsjLoaderPedido();
        }, 1600);
      }
    });

    // this.listenStatusService.callClienteSolicitaAtencion$.subscribe(res => {

    // });

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
        case 'mesas':
          // console.log('llegamos a mesas');
          this.listenStatusService.setshowLoadListMesas();
          // appListMesas.loadListMesas();
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

    this.listenStatusService.isLoaderCarta$.subscribe(res => {
      this.loaderPage = res;
      if ( this.loaderPage ) {
        this.verificarLoaderReload();
      } else {
        clearTimeout(this.timeLoader);
      }
    });

    // if ( this.socketService.isSocketOpen ) {
    //   this.socketService.connect();
    //   this.socketService.onGetClienteLlama().subscribe(res => {
    //     console.log('cliente llama', res);
    //   });
    // }

    // this.tooltip.show();
    // setTimeout(() => {
    //   // this._matTooltip.position = 'below';
    //   // this._matTooltip.tooltipClass = 'example-tooltip-red-1';
    //   this._matTooltip.show();
    // }, 1000);


    // setTimeout(() => {
    //   this.comandAnalizerService.cocinarComand('bienvenido');
    // }, 500);

  }

  // 12 segundos de cargar, reload page
  private verificarLoaderReload() {
    this.timeLoader = setTimeout(() => {
      if ( this.loaderPage ) {
        window.location.reload();
      }
    }, 12000);
  }

  onScroll($event: any): void {
    const val = $event.srcElement.scrollTop;
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 0 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }

  clickTab($event: any) {



    // console.log('event tab', $event);
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

  pruebaMsjs() {

    this.listenStatusService.setIsFinishLoaderSendPedidoSource(true);

  }

  closeMsjLoaderPedido() {
    // this.listenStatusService.setIsFinishLoaderSendPedidoSource(false);
    // this.listenStatusService.setLoaderSendPedido(false);

    this.listenStatusService.closeFinishLoaderSendPedidoSource();
  }

  goBackCarta() {
    this.listenStatusService.setListenGoCarta();
  }
}
