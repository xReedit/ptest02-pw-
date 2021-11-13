import { Component, OnInit, ViewChild, ElementRef, Renderer2} from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogResetComponent } from 'src/app/pages/pedido/resumen-pedido/dialog-reset/dialog-reset.component';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { Router } from '@angular/router';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { filter } from 'rxjs/operators';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DialogConfigPuntoComponent } from 'src/app/componentes/dialog-config-punto/dialog-config-punto.component';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 500,
  hideDelay: 1000,
  touchendHideDelay: 500,
};


@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css'],
  providers: [
    {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}
  ]
})


export class ToolBarComponent implements OnInit {
  isBusqueda = false;
  rippleColor = 'rgba(238,238,238,0.2)';
  rippleColorBusqueda = 'rgba(238,238,238,0.9)';
  rippleColorPlomo = 'rgba(158,158,158,0.5)';
  isClienteDelivery = false;
  isCliente = false;
  isSpeechVoiceAcivado = false;
  isActiveMozoVoz = false;


  nomSede = '';
  idSedeCartaVirtual: number;
  urlSharedCartaVirtual: string;

  @ViewChild('txtBuscar') txtBuscar: ElementRef;

  // isBuqueda=

  constructor(
    private miPedidoService: MipedidoService,
    // private socketService: SocketService,
    private navigatorService: NavigatorLinkService,
    private dialog: MatDialog,
    private listenStatusService: ListenStatusService,
    private renderer: Renderer2,
    private infoTokenService: InfoTockenService,
    private utilitariosSerivce: UtilitariosService,
    private crudService: CrudHttpService,
    private establecimientoService: EstablecimientoService,
    ) { }

  ngOnInit() {

    // console.log('establecimientoService', this.establecimientoService.get());
    this.isSpeechVoiceAcivado = this.establecimientoService.get().speech_disabled === 1;

    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
      // console.log('liste isBusqueda', res);
    });

    this.listenStatusService.hayDatosSede$.pipe(filter(res => res === true)).subscribe(res => {
      this.getNomSede();
    });

    this.isClienteDelivery = this.infoTokenService.isDelivery();
    this.isCliente = this.infoTokenService.isCliente();
    this.idSedeCartaVirtual = this.infoTokenService.infoUsToken.idsede;


    this.isActiveMozoVoz = this.isSpeechVoiceAcivado && this.isCliente && !this.isClienteDelivery;

    this.getLinkSharedCarta();
  }

  private getNomSede(): void {
    this.nomSede =  this.miPedidoService.objDatosSede.datossede[0].sedenombre;
  }

  private getLinkSharedCarta() {
    const _dataSend = {
      idsede: this.idSedeCartaVirtual
    };

    this.crudService.postFree(_dataSend, 'delivery', 'get-shared-url-carta', false)
    .subscribe((res: any) => {
      this.urlSharedCartaVirtual = res.data[0].qr_delivery;
    });
  }

  activaBusqueda(): void {
    this.navigatorService.setPageActive('carta');
    this.navigatorService.addLink('carta-i-');

    this.listenStatusService.setIsBusqueda();


    setTimeout(() => {
      if ( !this.txtBuscar ) {return; }
      this.renderer.selectRootElement(this.txtBuscar.nativeElement).focus();
      this.txtBuscar.nativeElement.value = this.getStorageBusqueda();
      // this.renderer.selectRootElement(this.txtBuscar.nativeElement).value('aaaaaa');
    }, 300);
  }

  buscarCharAhora(charFind: string): void {
    // console.log(charFind);
    this.listenStatusService.setCharBusqueda(charFind);
    this.setStorageBusqueda(charFind);
  }

  private setStorageBusqueda(charFind: string): void {
    window.localStorage.setItem('sys::find', charFind);
  }

  private getStorageBusqueda(): string {
    return window.localStorage.getItem('sys::find') || '';
  }

  clearTextBuqueda() {
    this.renderer.selectRootElement(this.txtBuscar.nativeElement).focus();
    this.txtBuscar.nativeElement.value = '';
    window.localStorage.setItem('sys::find', '');
  }

  cerrarSession(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {idMjs: 1};

    const dialogReset = this.dialog.open(DialogResetComponent, dialogConfig);
    dialogReset.afterClosed().subscribe(result => {
      if (result ) {
        this.miPedidoService.resetAllNewPedido();
        this.miPedidoService.cerrarSession();
        // this.socketService.closeConnection();
        // this.navigatorService.cerrarSession();
        this.infoTokenService.cerrarSession();
      }
  });
}


goBackOutEstablecimiento() {
  const dialogConfig = new MatDialogConfig();
      dialogConfig.data = {idMjs: 2};

      const dialogReset = this.dialog.open(DialogResetComponent, dialogConfig);
      dialogReset.afterClosed().subscribe(result => {
        if (result ) {
          this.miPedidoService.resetAllNewPedido();
          this.miPedidoService.cerrarSession();
          // this.socketService.closeConnection();
          // this.navigatorService.cerrarSession();
          this.infoTokenService.cerrarSession();
        }
      });

}

sharedCarta() {
  this.utilitariosSerivce.sharedNative(this.urlSharedCartaVirtual, this.nomSede);
}

configPunto() {

  const dialogConfig = new MatDialogConfig();

  // dialogConfig.panelClass = 'dialog-item-edit';
  dialogConfig.panelClass =  ['my-dialog-orden-detalle', 'my-dialog-scrool'];

  this.dialog.open(DialogConfigPuntoComponent, dialogConfig);
}


}
