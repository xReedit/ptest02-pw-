// servicio adminsitra el navigator link -- carta y resumen
import { Injectable } from '@angular/core';
import { Event as NavigationEvent, Router, NavigationStart } from '@angular/router';
import { filter, bufferCount } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { InfoTockenService } from './info-token.service';
import { EstadoPedidoClienteService } from './estado-pedido-cliente.service';
import { ListenStatusService } from './listen-status.service';

@Injectable({
  providedIn: 'root'
})
export class NavigatorLinkService {

  public disabledBack = false;
  private resNavigatorSource = new BehaviorSubject<any[]>([]);
  public resNavigatorSourceObserve$ = this.resNavigatorSource.asObservable();

  private pageActive = 'carta';

  private resNavigator: any = [];
  private historyNavigator: any[] = [];
  public lastUrlHistory = '';
  public nowUrl = '';

  closeListenNavigator = false;


  constructor(
    private router: Router,
    private infoTokenService: InfoTockenService,
    private listenService: ListenStatusService,
    // private estadoPedidoClienteService: EstadoPedidoClienteService,
    // private dialog: MatDialog,
    // private miPedidoService: MipedidoService,
  ) {


    this.listenEventNavigator();
  }

  private listenEventNavigator() {
    if ( this.closeListenNavigator ) {return; }
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart)
      , bufferCount(2, 1)).subscribe((e: any) => {
        // return false;
        if ( this.closeListenNavigator ) {return; }

        if (e !== null && e !== undefined) {
          this.nowUrl = e[0]['url'];
          // if ( this.disabledBack ) {return false; }
          if (e[1].navigationTrigger === 'popstate') {
            // this.managerGoZonaEstablecimiento(e[0]['url'], e); // a la pagina que va
            // desahabilitar boton back
            if ( this.disabledBack ) {return false; }

            const elUrl = e[0]['url'];

            const _url = elUrl.indexOf(';') ? e[0]['url'].substr(1).split(';')[1].split('=')[1] : e[0]['url'];
            // const _nextUrl = e[1]['url'].substr(1).split(';')[1].split('=')[1];
            if ( _url.length > 0) {
              this.lastUrlHistory = _url; // last url -- de donde viene
              this.managerGoBack(_url, '');
            }
          }
          // console.log(e[0]);
        }
      });
  }


  setPageActive(_pageActive): void {
    // return;
    this.pageActive = _pageActive;
    this.lastUrlHistory = _pageActive !== 'carta' ? _pageActive : this.lastUrlHistory;

    const itemHistory = this.findPageActiveInHistory(_pageActive);

    if ( itemHistory ) { // si existe
      this.addLink(itemHistory.url);
    } else {
      // this.saveHistoryPageActive(_pageActive, _pageActive);
      this.addLink(_pageActive);
    }
    this.resNavigator.pageActive = _pageActive;
    this.resNavigator.url = itemHistory ? itemHistory.url : _pageActive;
    this.resNavigatorSource.next(this.resNavigator);
  }

  private saveHistoryPageActive(key: string, url: string): void {
    // return;
    this.historyNavigator[key] = [];
    this.historyNavigator[key].key = key;
    this.historyNavigator[key].url = url;
  }

  private findPageActiveInHistory(_key: string): any {
    // return false;
    return Object.values(this.historyNavigator).filter(x => x.key === _key)[0];
  }

  addLink(params: string): void {
    // return;
    this.router.navigate(['.', { state: params }]);

    this.saveHistoryPageActive(this.pageActive, params);
  }

  cerrarSession(reload: boolean = false) {
    if ( this.infoTokenService.isReserva() ) {
      this.router.navigate(['../home']);
      return;
    }

    if ( this.infoTokenService.isDelivery() ) {
      this.router.navigate(['../zona-delivery']);
      // this.router.navigate(['../home']);
    } else {
      this.router.navigate(['../'])
      .then(() => {
        if ( reload ) {
          window.location.reload();
        }
      });
    }
  }

  // maneja los back
  // si es [mipedido-confirma] -> ['mipedido']
  // si es [mipedido, estado] -> 'carta' - > historial
  // si es [carta-i-secciones-items] -> [carta-i-secciones]
  // si es [carta-i-secciones] -> [carta-i-]
  // si es [carta-i-] -> 'carta'
  // si es [carta] -> inicio
  managerGoBack(previusUrl: string, nexturl: string) {
    // return;
    console.log('previusUrl', previusUrl);
    if ( this.closeListenNavigator ) {return; }
    // const _url = this.lastUrlHistory;
    let _pageActive = '';
    console.log('managerGoBack', previusUrl);
    switch (previusUrl) {
      case 'carta-i-secciones-items':
        _pageActive = 'carta';
        this.addLink('carta-i-secciones');
        break;
      case 'carta-i-secciones':
        _pageActive = 'carta';
        this.addLink('carta-i-');
        break;
      case 'carta-i-':
        _pageActive = 'carta-o-';
        this.addLink('carta-o-');
        // console.log('=========================== listo para salir');
        this.listoParaSalir();
        break;
      // case 'carta-o':
      //   _pageActive = 'carta';
      //   this.addLink('carta');
      //   console.log('listo para salir');
      //   break;
      case 'mipedido-confirma':
        _pageActive = 'mipedido';
        this.addLink('mipedido');
        break;
      case 'mipedido':
        _pageActive = 'carta';
        this.addLink('carta');

        this.listoParaSalir();
        // console.log('=========================== listo para salir');
        break;
      case 'estado':
        _pageActive = 'carta';
        // this.findAndApplyHistory(_pageActive);
        break;
      case 'carta':
        // _pageActive = '';
        // this.router.navigate(['../']);
        _pageActive = 'carta';
        break;
      case 'lanzar-encuesta':
        _pageActive = 'lanzar-encuesta';
        break;
    }

    if (_pageActive !== '' ) {
      this.pageActive = _pageActive;
      this.setPageActive(_pageActive);
    }
  }


  // usar router de servicio
  _router(link: string) {
    this.router.navigate([link]);
    return false;
  }

  __router(link: string) {
    this.router.navigate([link]);
    return false;
  }

  disableGoBack(): void {

    this.disabledBack = true;
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };
  }

  private listoParaSalir(): void {
    if ( this.infoTokenService.isDelivery() ) {
      // abrir cerrarr
      // if ( this.estadoPedidoClienteService.estadoPedido.hayPedidoCliente ) {

        this.listenService.setIsOutEstablecimientoDelivery(true);

      // }
    }
  }

  setOffListenNavigator(val: boolean) {
    this.closeListenNavigator = val;
  }

  // private findAndApplyHistory(_pageActive): void {
  //   const itemHistory = this.findPageActiveInHistory(_pageActive);
  //   if (itemHistory) { // si existe
  //     this.addLink(itemHistory.url);
  //   }
  // }

  // goBack(): void {
  //   window.history.back();
  // }


}
