import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { RouterEvent, Router } from '@angular/router';
// import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
// import { NotificacionPushService } from 'src/app/shared/services/notificacion-push.service';
// import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
// import { DialogDesicionComponent } from 'src/app/componentes/dialog-desicion/dialog-desicion.component';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';


@Component({
  selector: 'app-establecimientos',
  templateUrl: './establecimientos.component.html',
  styleUrls: ['./establecimientos.component.css']
})
export class EstablecimientosComponent implements OnInit {
  loaderPage = true;
  imgIcoCategoria = 'assets/images/icon-app/';
  listIcoCategoria: any;
  vistaInicio = 0;

  private isClienteLogueado = false;
  constructor(
    private crudService: CrudHttpService,
    // private navigatorService: NavigatorLinkService,
    private router: Router,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    // private pushNotificationSerice: NotificacionPushService,
    // private dialog: MatDialog
  ) { }

  ngOnInit() {

    // console.log('this.verifyClientService.getDataClient()', this.verifyClientService.getDataClient());
    const _dataDir = this.verifyClientService.getDataClient();
    this.isClienteLogueado = _dataDir.isCliente;
    this.vistaInicio = !_dataDir.direccionEnvioSelected ? 0 : _dataDir.direccionEnvioSelected.options ? _dataDir.direccionEnvioSelected.options.vista : 0;
    // this.goComercios();
    // console.log('establecimiento');
    this.xLoadCategoria();
    // this.navigatorService.disableGoBack();
    // window.onpopstate = function () {
    //   // history.go(0);
    //   window.history.forward();
    // };
    // window.history.forward();

    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        this.vistaInicio = res?.options?.vista ? res.options.vista : 0 ;

        // this.goComercios();
      }
    });

    this.listenService.setIsShowFooterZonaDelivery(true);

    // obtener permiso de notificaciones
    // this.lanzarPermisoNotificationPush();
  }

  private xLoadCategoria() {
    this.loaderPage = true;
    this.crudService.getAll('delivery', 'get-categorias', false, false, false)
      .subscribe((res: any) => {
        this.listIcoCategoria = res.data.map(x => {x.visible = x.img !== ''; return x; });
        const _allCategorias = JSON.stringify(this.listIcoCategoria);
        localStorage.setItem('sys:allcat', btoa(_allCategorias));
        // console.log('this.listIcoCategoria', this.listIcoCategoria);

        // setTimeout(() => {
        //   this.loaderPage = false;
        // }, 500);
        this.loaderPage = false;
      });
  }

  goComercioCategoria(idsede_categoria: number) {

    if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }

    const _subCategorias = JSON.stringify(this.listIcoCategoria.filter(x => x.idsede_categoria === idsede_categoria)[0].arritems);
    localStorage.setItem('sys:subcat', btoa(_subCategorias));
    localStorage.setItem('sys::cat', idsede_categoria.toString());
    setTimeout(() => {
      // this.router.navigate(['/zona-delivery/categorias'], { queryParams: { id: idsede_categoria } });
      this.router.navigate(['/zona-delivery/categorias']);
    }, 300);
  }

  registarDirCliente() {
    this.verifyClientService.setIsDelivery(true);
    this.router.navigate(['/login-client']);
  }

  goComercios() {
    if (this.vistaInicio === 0 ) {return; }
    localStorage.setItem('sys:subcat', '0');
    localStorage.setItem('sys::cat', '-1');
    setTimeout(() => {
      this.router.navigate(['/zona-delivery/categorias']);
    }, 300);
  }

  checkOut(op: number) {
    if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }

    setTimeout(() => {
      this.listenService.setIsShowFooterZonaDelivery(false);
      switch (op) {
        case 0:
          this.router.navigate(['/zona-delivery/lo-que-quieras']);
          break;
        case 1:
          this.router.navigate(['/zona-delivery/pedidos-express']);
          break;
      }
    }, 300);
  }

  // private lanzarPermisoNotificationPush() {
  //   // this.pushNotificationSerice.suscribirse(option);

  //   if ( this.pushNotificationSerice.getIsTienePermiso() ) {
  //     this.pushNotificationSerice.suscribirse();
  //     return;
  //   }

  //   // si no tiene permiso le pregunta
  //   const _dialogConfig = new MatDialogConfig();
  //   _dialogConfig.disableClose = true;
  //   _dialogConfig.hasBackdrop = true;
  //   _dialogConfig.data = {idMjs: 1};

  //   // console.log('show dialog DialogDesicionComponent');
  //   const dialogReset = this.dialog.open(DialogDesicionComponent, _dialogConfig);
  //   dialogReset.afterClosed().subscribe(result => {
  //     if (result ) {
  //       // console.log('result dialog DialogDesicionComponent', result);
  //       // this.suscribirse();
  //       this.pushNotificationSerice.suscribirse();
  //     }
  //   });
  // }

}
