import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  infoClient: SocketClientModel;
  nomDireccionCliente = 'Establecer una direccion de entrega';
  isSelectedDireccion = false;

  infoUser: UsuarioTokenModel;

  constructor(
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private dialogDireccion: MatDialog,
    private listenService: ListenStatusService,
    private router: Router,
    private socketService: SocketService,
    private navigartoService: NavigatorLinkService
  ) { }

  ngOnInit() {
    window.history.forward();
    // history.pushState(null, null, document.title);

    this.infoTokenService.converToJSON();
    this.infoClient = this.verifyClientService.getDataClient();

    this.setDireccion(this.infoClient.direccionEnvioSelected);
    // console.log('this.infoToken', this.infoClient);
    this.socketService.connect(this.infoClient, 0, true);

    // if ( this.infoTokenService.infoUsToken ) {
    //   this.infoUser = this.infoTokenService.infoUsToken;
    //   this.socketService.connect(this.infoClient, 0, true);
    // } else {
    //   this.verifyClientService.verifyClient()
    //   .subscribe(res => {
    //     this.infoUser = res;
    //     this.infoTokenService.infoUsToken = res;
    //     this.infoTokenService.set();
    //     this.infoTokenService.converToJSON();
    //     this.socketService.connect(this.infoClient, 0, true);
    //   });
    // }


    // si no hay direccion abre el dialog
    // setTimeout(() => {
    //   if ( !this.isSelectedDireccion ) {
    //     this.openDialogDireccion();
    //   }
    // }, 800);


    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        // this.codigo_postal_actual = res.codigo;
        this.setDireccion(res);
      }
    });
  }

  // ngOnDestroy(): void {
  //   this.socketService.isSocketOpenReconect = true;
  //   this.socketService.closeConnection();
  // }

  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.verifyClientService.setDireccionDeliverySelected(data);
        this.setDireccion(data);
      }
    );
  }

  setDireccion(direccion: DeliveryDireccionCliente) {
    if ( direccion ) {
      this.isSelectedDireccion = true;
      const _direccion = direccion.direccion.split(',');
      this.nomDireccionCliente = _direccion[0] + ' ' + _direccion[1];
      // this.listenService.setChangeDireccionDelivery(direccion);
    }
  }

  clickTab($event) {
    console.log($event);
    let goToPage = '/categorias';
    switch ($event.index) {
      case 0:
        goToPage = '/establecimientos';
        break;
      case 1:
        goToPage = '/pedidos';
        // this.router.navigate(['/mis-pedidos']);
        break;
      }

    this.router.navigate([`zona-delivery${goToPage}`]);
    // this.router.navigate([goToPage]);
  }

  goBack() {
    // console.log('this.navigartoService.nowUrl', this.navigartoService.nowUrl);

    if ( window.location.href.indexOf('/zona-delivery/establecimientos') > -1 ) {
      this.navigartoService._router('../');
      return;
    }
    window.history.back();
  }

}
