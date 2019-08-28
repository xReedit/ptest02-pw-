import { Component, OnInit } from '@angular/core';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  isVisibleToolBar = true;
  countTotalItems = 0;

  private lastValScrollTop = 0;

  constructor(private miPedidoService: MipedidoService) { }

  ngOnInit() {

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
}
