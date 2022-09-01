import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-comp-list-mesas',
  templateUrl: './comp-list-mesas.component.html',
  styleUrls: ['./comp-list-mesas.component.css']
})
export class CompListMesasComponent implements OnInit {

  private destroy$: Subject<boolean> = new Subject<boolean>();
  listMesas = [];
  countPersonal = 0;
  countCliente = 0;
  showLoaderListMesa = true;

  rippleColor = 'rgb(255,238,88, 0.5)';

  private keyLocalStorage = 'sys::time-list-table';
  private isHayPedidoPendiente = false; // si hay pedido pendiente avisa para mirar la cuenta

  constructor(
    private socketService: SocketService,
    private crudService: CrudHttpService,
    private infoToken: InfoTockenService,
    private navigatorService: NavigatorLinkService,
    private listenStatusService: ListenStatusService,
    private utilitariosService: UtilitariosService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // this.loadListMesas();

    localStorage.removeItem(this.keyLocalStorage);

    this.listenStatusService.showLoadListMesas$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: boolean) => {
      if ( res ) {
        this.loadListMesas();
      }
    });

    this.listenStatusService.hayPedidoPendiente$
    .pipe(takeUntil(this.destroy$))
    .subscribe((res: boolean) => {
      this.isHayPedidoPendiente = res;
    });

    this.socketService.onGetMesaPagada()
      .subscribe((res: any) => {
        this.removeMesaList(res.num_mesa);
      });

    this.socketService.onGetNewPedidoMesa()
      .subscribe((res: any) => {
        this.listMesas.push(res);
        // this.removeMesaList(res.num_mesa);
      });
  }

  loadListMesas() {
    if ( !this.verifyTimeLoadListmesas() ) {return; }

    this.showLoaderListMesa = true;
    const _data = {idsede: this.infoToken.infoUsToken.idsede };
    this.crudService.postFree(_data, 'pedido', 'get-list-mesas', true)
      .subscribe(res => {
        this.showLoaderListMesa = false;
        this.listMesas = res.data.map(x => {
          x.remove = false;
          return x;
        });

        this.countPersonal = this.listMesas.length;
        this.countCliente = this.listMesas.map(x => x.flag_is_cliente).reduce((a, b) => a + b, 0);
        this.countPersonal = this.countPersonal - this.countCliente;
      });
  }

  orderList(op: number) {
    this.listMesas = this.listMesas.sort((a, b) => op === 1 ? b.flag_is_cliente - a.flag_is_cliente : a.flag_is_cliente - b.flag_is_cliente);
  }

  goCuentaMesa(item: any) {
    if ( this.isHayPedidoPendiente ) {
      // si no tiene permiso le pregunta
      const _dialogConfig = new MatDialogConfig();
      _dialogConfig.disableClose = true;
      _dialogConfig.hasBackdrop = true;
      _dialogConfig.data = {idMjs: 2};

      const dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
      dialogReset.afterClosed().subscribe(result => {
        if ( !result ) {return; }
        this.showCuentaMesa(item);
      });
    } else {
      this.showCuentaMesa(item);
    }

  }

  private showCuentaMesa(item: any) {
    this.navigatorService.setPageActive('mipedido');
    this.listenStatusService.setShowCuentaMesaNumero(item.nummesa);
  }

  private removeMesaList(numMesa: number) {
    const _itemRemove = this.listMesas.find(x => x.nummesa === numMesa);
    if ( _itemRemove ) {
      _itemRemove.remove = true;
      setTimeout(() => {
        this.listMesas = this.listMesas.filter(x => x.nummesa !== numMesa);
      }, 700);
    }
  }

  private verifyTimeLoadListmesas(): boolean {
    const _timeLastLoad = localStorage.getItem(this.keyLocalStorage);
    if ( _timeLastLoad ) {
      const _timeMin = this.utilitariosService.getTimeMinutesDiff(_timeLastLoad);
      if (_timeMin > 4) { // 4 min
        localStorage.setItem(this.keyLocalStorage, new Date().toString());
        return true;
      } else {
        return false;
      }
    } else {
      localStorage.setItem(this.keyLocalStorage, new Date().toString());
      return true;
    }
  }

}
