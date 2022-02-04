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

import { URL_IMG_COMERCIO } from 'src/app/shared/config/config.const';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { SocketService } from 'src/app/shared/services/socket.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';

@Component({
  selector: 'app-establecimientos',
  templateUrl: './establecimientos.component.html',
  styleUrls: ['./establecimientos.component.css']
})
export class EstablecimientosComponent implements OnInit {
  loaderPage = true;
  imgIcoCategoria = 'assets/images/icon-app/';
  listIcoCategoria: any;
  listPromociones = [];
  vistaInicio = 0;
  timeLoader = null;

  imgComercio = URL_IMG_COMERCIO;

  listEstablecimientos: DeliveryEstablecimiento[];
  ciudad_actual: string; // ciudad de direccion seleccionada
  codigo_postal_actual: string; // codigo postal de direccion seleccionada
  isNullselectedDireccion = true; // para mostrar comercios segun ciudad desde el inicio

  private isClienteLogueado = false;
  constructor(
    private crudService: CrudHttpService,
    // private navigatorService: NavigatorLinkService,
    private router: Router,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    private socketService: SocketService,
    private establecimientoService: EstablecimientoService,
    private pedidoService: MipedidoService,
    private plazaDelivery: SedeDeliveryService
    // private pushNotificationSerice: NotificacionPushService,
    // private dialog: MatDialog
  ) { }

  ngOnInit() {

    // console.log('this.verifyClientService.getDataClient()', this.verifyClientService.getDataClient());
    const _dataDir = this.verifyClientService.getDataClient();
    this.isClienteLogueado = _dataDir.isCliente || false;


    this.vistaInicio = !_dataDir.direccionEnvioSelected ? 0 : _dataDir.direccionEnvioSelected.options ? _dataDir.direccionEnvioSelected.options.vista : 0;

    if ( this.vistaInicio === 0 && _dataDir.direccionEnvioSelected ) {
      if ( !_dataDir.direccionEnvioSelected?.options ) {
        this.plazaDelivery.loadDatosPlazaByCiudad(_dataDir.direccionEnvioSelected.ciudad)
        .subscribe((resPlaza: any) => {
          this.vistaInicio = resPlaza ? resPlaza.options.vista : 0;
        });
      }
    }

    // console.log('_dataDir.direccionEnvioSelected', _dataDir.direccionEnvioSelected);
    // console.log('_dataDir', _dataDir);
    // this.goComercios();
    // console.log('establecimiento');
    this.xLoadCategoria();
    // this.navigatorService.disableGoBack();
    // window.onpopstate = function () {
    //   // history.go(0);
    //   window.history.forward();
    // };
    // window.history.forward();

    localStorage.setItem('sys:city', '');


    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res && this.isClienteLogueado ) {
        this.vistaInicio = res?.options?.vista ? res.options.vista : 0 ;
        this.ciudad_actual = res.ciudad;
        this.isNullselectedDireccion = false;

        // console.log('this.ciudad_actual === >', this.ciudad_actual );

        this.loadEstablecimientos();
        this.loadEstablecimientosPromos();

        // this.goComercios();
      }
    });

    this.listenService.setIsShowFooterZonaDelivery(true);

    // obtener permiso de notificaciones
    // this.lanzarPermisoNotificationPush();
  }

  private xLoadCategoria() {
    this.loaderPage = true;
    this.verificarLoaderReload();

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
        clearTimeout(this.timeLoader);
      });
  }

  // 12 segundos de cargar, reload page
  private verificarLoaderReload() {
    this.timeLoader = setTimeout(() => {
      if ( this.loaderPage ) {
        window.location.reload();
      }
    }, 12000);
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

  loadEstablecimientos() {

    const _lastCiudadSearch = localStorage.getItem('sys:city') || '';

    if ( _lastCiudadSearch.toLowerCase() === this.ciudad_actual.toLowerCase()) { return; }

    const _data = {
      idsede_categoria: -1,
      codigo_postal: this.ciudad_actual // this.codigo_postal_actual, cambiamos el 310720
    };

    this.listEstablecimientos = [];

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        // setTimeout(() => {
          // console.log('_data get establecimientos', res);
          if ( res.data.length === 0 ) {return; }
          this.listEstablecimientos = res.data;

          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            dirEstablecimiento.visible = true;
            dirEstablecimiento.img_mini = `${this.imgComercio}/${dirEstablecimiento.img_mini}`;
            // this.calcDistancia(x);
            // this.calcDistanceService.calculateRoute(this.direccionCliente, dirEstablecimiento);
            // dirEstablecimiento.c_servicio = _c_servicio;

          });


          this.listEstablecimientos = this.listEstablecimientos.reduce((results: any, org: any) => {
            if (!results.length) {
              results = [];
            }

            const _buscarCat = results.filter(x => x.idsede_categoria === org.idsede_categoria)[0];
            if (_buscarCat) {
               if (_buscarCat.comercios.length < 10) {
                 _buscarCat.comercios.push(org);
              }
            } else {
              const _new_categoria = {
                idsede_categoria: org.idsede_categoria,
                nom_categoria: org.nom_categoria,
                color_fondo: org.color_fondo,
                orden: org.orden,
                comercios: [org]
              };

              results.push(_new_categoria);
            }

            // si es nuevo ingreso
            if ( org.nuevo_ingreso === 1 ) {
              const _newsIngresos = results.filter(x => x.idsede_categoria === -1)[0];
              if ( _newsIngresos ) {
                _newsIngresos.comercios.push(org);
              } else {
                const _new_categoria_in = {
                  idsede_categoria: -1,
                  nom_categoria: 'Nuevos Ingresos',
                  color_fondo: '#fff7dd',
                  orden: -1,
                  comercios: [org]
                };

                results.push(_new_categoria_in);
              }
            }

            // (results[org.idsede_categoria] = results[org.idsede_categoria] || []).push(org);
            return results;
        }, {});

        this.listEstablecimientos.sort((a: any, b: any) => a.orden - b.orden);


        // guardamos ciudad_actual
        localStorage.setItem('sys:city', this.ciudad_actual);
      });
  }


  itemSelected($event: DeliveryEstablecimiento) {
    // console.log('establecimiento seleccionada', $event);

    // busca en el cache si ya calculo la distancia con la api de google
    // const _establecimientoCache = this.establecimientoService.getFindDirClienteCacheEstableciemto(this.direccionCliente, $event);
    // if ( _establecimientoCache.calcApiGoogle ) {
    //    this.calcDistanceService.calculateRoute(this.direccionCliente, $event, false);
    // }

    if ( $event.cerrado === 1 ) {return; }
    this.socketService.closeConnection();

    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(true);

    // console.log('establecimiento selected', $event);
    this.establecimientoService.set($event);

    // restcarta
    this.pedidoService.resetAllNewPedido();

    // al regresar para que vuelva a los datos
    localStorage.setItem('sys:city', '');

    this.router.navigate(['/callback-auth']);

  }

  loadEstablecimientosPromos() {
    const _data = {
      ciudad: this.ciudad_actual // this.codigo_postal_actual, cambiamos el 310720
    };

    this.listPromociones = [];

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos-promos', false)
    .subscribe( (res: any) => {
      this.listPromociones = res.data.length > 0 ? res.data.filter(x => x.idpromocion) : [];
      });
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
