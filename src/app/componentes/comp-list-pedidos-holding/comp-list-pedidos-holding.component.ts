import { Component } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-comp-list-pedidos-holding',
  templateUrl: './comp-list-pedidos-holding.component.html',
  styleUrls: ['./comp-list-pedidos-holding.component.css']
})
export class CompListPedidosHoldingComponent {

  listCallsMarcasHolding = [];

  constructor(
    private httpClient: CrudHttpService,
    private socketService: SocketService,
    private navigatorLinkService: NavigatorLinkService
  ) { }

  ngOnInit(): void {      

    this.navigatorLinkService.resNavigatorSourceObserve$
    .subscribe((res: any) => {
      if ( res.pageActive === 'pedidos' ) {

        this.loadPedidoCallsMarca();

        this.socketService.onCallPedidoListoMarca()
        .subscribe((res: any) => {     
          res.en_camino = false;       
          this.addItemCallListLLamadaMarca(res);
        });
      }      
    });
  }

  private loadPedidoCallsMarca() {
    this.httpClient.getAll('holding', 'list-call-mozo', false, false, true)
    .subscribe((res: any) => {
      console.log('loadPedidoCallsMarca', res);
      if ( res.data ) {
        this.addItemCallListLLamadaMarca(res.data[0].data);
      }
    });
  }

  private addItemCallListLLamadaMarca(item: any) {
    console.log('item', item);	
    const itemCall = this.listCallsMarcasHolding.filter(x =>  x.idpedido === item.idpedido)[0];
    if ( !itemCall ) {
      this.playAudio();
      this.listCallsMarcasHolding.push(item);
    }
  }

  private playAudio() {
    const audio = new Audio();
    // audio.src = 'https://restobar.papaya.com.pe/sound/notifica-llamado.mp3';
    audio.src = '../assets/sound/notifica-llamado.mp3';
    audio.load();

    try {
      audio.play();

      // tslint:disable-next-line:max-line-length
      window.navigator.vibrate([100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50, 100, 50, 100, 100, 100, 50 , 50]);
    } catch (error) {}
  }

  private removeItemCallMarcaList(idpedido: string) {
    this.listCallsMarcasHolding = this.listCallsMarcasHolding.filter(x =>  x.idpedido !== idpedido);
  }

  goCallMarca(marca: any) {
    marca.en_camino = true;
    // this.socketService.emit('notificar-cliente-llamado-voy', nummesa);
    this.socketService.emit('notificar-marca-mozo-en-camino', marca);    
    setTimeout(() => {
      this.removeItemCallMarcaList(marca.idpedido);
    }, 4000);
  }

}
