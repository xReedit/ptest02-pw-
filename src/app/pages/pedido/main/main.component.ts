import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';

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


  private lastValScrollTop = 0;

  constructor(
    private miPedidoService: MipedidoService,
    private navigatorService: NavigatorLinkService,
    private listenStatusService: ListenStatusService,
    public socketService: SocketService
    ) {
    }

  ngOnInit() {
    this.socketService.isSocketOpenReconect = false;
    this.navigatorService.setPageActive('carta');
    // this.navigatorService.addLink('carta');

    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
    });

    this.listenStatusService.hayCuentaBusqueda$.subscribe(res => {
      this.isHayCuentaBusqueda = res;
    });

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      if (res.pageActive === 'carta') {
        this.selectedTab = 0;

        this.resetObjCuenta();
        console.log(this.selectedTab);
      }
    });

    this.miPedidoService.countItemsObserve$.subscribe((res) => {
      this.countTotalItems = res;
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
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 54 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }

  clickTab($event: any) {
    console.log('event tab', $event);
    this.selectedTab = $event.index;
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
}
