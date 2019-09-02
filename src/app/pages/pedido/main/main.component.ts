import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  isVisibleToolBar = true;
  countTotalItems = 0;
  selectedTab = 0;


  private lastValScrollTop = 0;

  constructor(
    private miPedidoService: MipedidoService,
    private navigatorService: NavigatorLinkService
    ) {
    }

  ngOnInit() {
    this.navigatorService.setPageActive('carta');
    // this.navigatorService.addLink('carta');

    this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {
      if (res.pageActive === 'carta') {
        this.selectedTab = 0;
        console.log(this.selectedTab);
      }
    });

    this.miPedidoService.countItemsObserve$.subscribe((res) => {
      this.countTotalItems = res;
    });
  }

  onScroll($event: any): void {
    const val = $event.srcElement.scrollTop;
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 54 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }

  clickTab($event) {
    console.log('event tab', $event);
    this.selectedTab = $event.index;
    const _pageActive = $event.tab.textLabel.toLowerCase();
    this.navigatorService.setPageActive(_pageActive);
    // this.navigatorService.restorePage(_pageActive);
  }
}
