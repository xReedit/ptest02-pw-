import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import Isotope from 'isotope-layout';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { Router, ActivatedRoute } from '@angular/router';
// import { AuthService } from 'src/app/shared/services/auth.service';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { DialogDireccionClienteDeliveryComponent } from 'src/app/componentes/dialog-direccion-cliente-delivery/dialog-direccion-cliente-delivery.component';
import { DireccionEntregaService } from 'src/app/shared/services/direccion-entrega.service';
// import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
  animations: [
    // Crossfade suave entre pastillas y buscador: solo opacidad, sin deslizar. El
    // que sale se saca de flujo (absolute) mientras se desvanece, para que el que
    // entra no lo empuje y la grilla de abajo no salte. El pequeno retardo del
    // que entra encadena la mezcla.
    trigger('cambioBusqueda', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms 80ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ position: 'absolute', width: '100%', top: 0, left: 0 }),
        animate('220ms ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class CategoriasComponent implements OnInit, OnDestroy, AfterViewInit {
  // rippleColor = 'rgb(255,238,88, 0.2)';
  loaderPage = false;
  listEstablecimientos: DeliveryEstablecimiento[]; // es se utiliza para filtrar
  listEstablecimientosMaster: DeliveryEstablecimiento[];
  listPromociones = [];

  codigo_postal_actual: string; // codigo postal de direccion seleccionada
  ciudad_actual: string; // ciudad de direccion seleccionada
  infoClient: SocketClientModel;
  isNullselectedDireccion = true;
  isSelectedDireccion = false;
  direccionCliente: DeliveryDireccionCliente;

  listSubCatFiltros: any = []; // sub categorias visibles (solo las que tienen comercio)
  private listSubCatFiltrosAll: any[] = []; // todas las sub categorias, antes de depurar vacias

  private idcategoria_selected: any;
  private isMismaDireccionSelectd = false; // si es la misma direccion el calculo de distancia y costo de servicio lo trae de cache
  // private veryfyClient: Subscription = null;

  private isClienteLogueado = false;

  private unsubscribe$: Subject<any> = new Subject<any>();

  // Isotope: grilla que filtra y reacomoda las tarjetas con animacion de posicion.
  @ViewChild('gridComercios') private gridComercios: ElementRef<HTMLElement>;
  private iso: any = null;
  private vistaLista = false;      // el <ng-if> de la grilla ya monto el contenedor
  private idFiltroCategoria = 0;   // 0 = todas
  private textoFiltro = '';

  isShowTextBusquedaComercio = false;

  // repeticiones para el esqueleton de carga
  skeletonChips = [1, 2, 3, 4, 5, 6];
  skeletonCards = [1, 2, 3, 4, 5, 6];
  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    // private authService: AuthService,
    // private infoToken: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    private dialogDireccion: MatDialog,
    private calcDistanceService: CalcDistanciaService,
    private establecimientoService: EstablecimientoService,
    private socketService: SocketService,
    private infoTokenService: InfoTockenService,
    private pedidoService: MipedidoService,
    private direccionEntrega: DireccionEntregaService
    // private activatedRoute: ActivatedRoute,
    // private navigatorService: NavigatorLinkService,
  ) { }

  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
    this.destroyIsotope();
  }

  ngAfterViewInit() {
    this.vistaLista = true;
    // si la lista ya cargo antes de montar la vista, arma Isotope ahora
    if (this.listEstablecimientos && this.listEstablecimientos.length > 0) {
      this.reconstruirIsotope();
    }
  }

  ngOnInit() {
    // window.history.forward();
    // history.pushState(null, null, location.href);
    // window.onpopstate = function () {
    //     history.go(1);
    // };
    // history.pushState(null, null, document.title);

    // escucha si se cierra comercio from monitor
    // this.socketService.onComercioOpenChangeFromMonitor()
    //   .subscribe((res: any) => {
    //     console.log('onComercioOpenChangeFromMonitor id ', res);
    //     const _esChange = this.listEstablecimientos.filter(e => e.idsede === res.idsede)[0];
    //     if ( _esChange ) {
    //       _esChange.cerrado = res.estado;
    //     }

    //     // this.listEstablecimientos = JSON.parse(JSON.stringify(this.listEstablecimientos));
    //   });


    // reseteamos
    // this.infoTokenService.getInfoUs();
    if ( this.infoTokenService?.infoUsToken?.tiempoEntrega ) {
      this.infoTokenService.infoUsToken.tiempoEntrega = null;
      this.infoTokenService.set();
    }


    this.idcategoria_selected = localStorage.getItem('sys::cat');
    if ( this.idcategoria_selected !== '-1' ) {
      // 'sys:subcat' no siempre trae base64: establecimientos escribe el texto '0'
      // cuando la categoria no tiene subcategorias. Sin esta guarda el atob rompia
      // el ngOnInit entero y la pantalla nunca llegaba a suscribirse a la direccion,
      // asi que la lista de comercios no cargaba nunca.
      this.listSubCatFiltros = this.leerSubCategoriasGuardadas();

      // preparr filtro
      this.listSubCatFiltros.map(x => x.selected = false);
      this.listSubCatFiltros.unshift({ id: 0, descripcion: 'Todos', selected: true });
      this.listSubCatFiltros.unshift({ id: 0, descripcion: 'buscar', selected: false });
      // copia completa: las pastillas visibles se derivan de esta segun los
      // comercios que realmente existan (ver depurarCategoriasVacias).
      this.listSubCatFiltrosAll = this.listSubCatFiltros.slice();
    } else {
      this.listSubCatFiltros = [];
      this.listSubCatFiltrosAll = [];
    }


    // this.activatedRoute.queryParams.subscribe(params => {
    //   if ( params['id'] ) {
    //     this.idcategoria_selected = params['id'];
    //     localStorage.setItem('sys::cat', this.idcategoria_selected.toString());
        // console.log('this.idcategoria_selected', this.idcategoria_selected);
    //   }
    // });

    // this.loadEstablecimientos();
    this.infoClient = this.verifyClientService.getDataClient();
    this.isClienteLogueado = this.infoClient.isCliente || false;

    // La direccion se toma del servicio, que es el unico dueño y guarda el valor
    // actual: si ya habia una elegida (o el visitante recarga la pagina) llega en la
    // primera emision, sin depender de que el evento del bus ocurra despues de que
    // esta pantalla se suscriba.
    this.direccionEntrega.seleccionada$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        this.codigo_postal_actual = res.codigo || '0';
        this.ciudad_actual = res.ciudad;
        this.isNullselectedDireccion = false;
        this.direccionCliente = res;

        // para el calculo distancia
        this.isMismaDireccionSelectd = this.infoClient.direccionEnvioSelected ? this.infoClient.direccionEnvioSelected.idcliente_pwa_direccion === this.direccionCliente.idcliente_pwa_direccion : false;

        this.infoClient.direccionEnvioSelected = this.direccionCliente;
        this.loadEstablecimientos();
        this.loadEstablecimientosPromos();
      } else {
        // console.log('dir null');
      }
    });

     // si no hay direccion abre el dialog
     setTimeout(() => {
      if ( this.isNullselectedDireccion ) {
        this.openDialogDireccion();
      }
    }, 800);
  }

  searchByNomComercio(nomComercio: string) {
    // La busqueda ya no reemplaza el arreglo (eso rompia el layout de Isotope):
    // todas las tarjetas siguen en el DOM e Isotope oculta/reacomoda las que no
    // coinciden por nombre, respetando la categoria activa.
    this.textoFiltro = nomComercio || '';
    this.filtrarIsotope();
  }

  clearTextBusquedaComercio() {
    this.textoFiltro = '';
    this.isShowTextBusquedaComercio = false;
    this.filtrarIsotope();
  }

  showTextBusquedaComercio() {
    this.isShowTextBusquedaComercio = true;
  }

  loadEstablecimientos() {
    this.loaderPage = true;
    const _data = {
      idsede_categoria: this.idcategoria_selected,
      codigo_postal: this.ciudad_actual, // this.codigo_postal_actual, cambiamos el 310720
      point_client: this.direccionCliente.latitude + ' ' + this.direccionCliente.longitude
    };

    this.listEstablecimientos = [];
    this.listEstablecimientosMaster = [];

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        // setTimeout(() => {
          this.listEstablecimientos = res.data;
          // console.log('this.listEstablecimientos', this.listEstablecimientos);
          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            dirEstablecimiento.visible = true;
            // this.calcDistancia(x);
            // this.calcDistanceService.calculateRoute(this.direccionCliente, dirEstablecimiento);
            // dirEstablecimiento.c_servicio = _c_servicio;

          });

        this.listEstablecimientosMaster = this.listEstablecimientos;

          // 250522 calculara la distancia cuando ingresa al comercio
          // this.setCalcDistanciaComercio();

        // solo dejar las pastillas de categorias que tengan al menos un comercio
        this.depurarCategoriasVacias();

        // baja el esqueleton y deja pintar las tarjetas reales; Isotope se monta
        // sobre ellas en el siguiente tick.
        this.loaderPage = false;
        this.reconstruirIsotope();
      }, () => {
        // si la consulta falla, quitar el esqueleton igual para no dejarlo girando
        this.loaderPage = false;
      });
  }

  // 250522 calculara la distancia cuando ingresa al comercio
  private async setCalcDistanciaComercio() {
    // const listEsblecimientosCache = this.isMismaDireccionSelectd ? this.establecimientoService.getEstableciminetosCache() : [];
    let listEsblecimientosCache = <any>this.establecimientoService.getEstableciminetosCache();


    // buscamos si la direccion del cliente ya fue cacheada
    listEsblecimientosCache = listEsblecimientosCache.filter(e => e.idcliente_pwa_direccion ===  this.direccionCliente.idcliente_pwa_direccion)[0];
    listEsblecimientosCache = listEsblecimientosCache ? listEsblecimientosCache.listEstablecimientos : [];

    const lentEstCache = listEsblecimientosCache.length;
    const lentArray = this.listEstablecimientos.length;
    let _dirEstablecimiento: any;
    let _establecimientoEnCache: any;
    let yaCalculado = false;

    // let _sleep = 0;
    // console.log('calc distancia');
    for (let index = 0; index < lentArray; index++) {
        yaCalculado  = false;
        _dirEstablecimiento = <DeliveryEstablecimiento>this.listEstablecimientos[index];
        _establecimientoEnCache = listEsblecimientosCache.filter(e => e.idsede === _dirEstablecimiento.idsede)[0];



        // si la direccion es la misma
        // if ( this.isMismaDireccionSelectd ) {
        //   // buscamos en cache
        //   if ( lentEstCache > 0 ) {
        //     const _estCache = <DeliveryEstablecimiento>listEsblecimientosCache.filter(e => e.idsede === _dirEstablecimiento.idsede)[0];
        //     if ( _estCache ) {
        //       _dirEstablecimiento.c_servicio = _estCache.c_servicio;
        //       _dirEstablecimiento.distancia_km = _estCache.distancia_km;
        //       yaCalculado  = true;
        //     }
        //   }

        // }

        if ( _establecimientoEnCache ) {
          // console.log('establecimiento cacheado', _establecimientoEnCache);
          _dirEstablecimiento.distancia_km = _establecimientoEnCache.distancia_km;
          _dirEstablecimiento.c_servicio = this.calcDistanceService.calCostoDistancia(_dirEstablecimiento, _establecimientoEnCache.distancia_km);
          // si el costo del delivery es mayor a 15 lo vuelve a calcular
          yaCalculado  = _dirEstablecimiento.c_servicio <= 15;
        }

        if ( _dirEstablecimiento.cerrado === 0 && !yaCalculado) {
          // console.log('calc distance', _dirEstablecimiento);
          // _sleep = 600;
          // this.calcDistanceService.calculateRoute(this.direccionCliente, _dirEstablecimiento, false);
          this.calcDistanceService.calculateRouteNoApi(this.direccionCliente, _dirEstablecimiento, false);
          _dirEstablecimiento.calcApiGoogle = false;
          listEsblecimientosCache.push(_dirEstablecimiento);
          // await this.sleep(600);
        }
    }

    // guardar lista en cache
    const establecimientoToCache = {
      idcliente_pwa_direccion: this.direccionCliente.idcliente_pwa_direccion,
      listEstablecimientos: listEsblecimientosCache
    };

    this.establecimientoService.setEstableciminetosCache(establecimientoToCache);
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // private calcDistancia(direccionEstablecimiento: DeliveryEstablecimiento) {
  //   this.calcDistanceService.calculateRoute(this.direccionCliente, direccionEstablecimiento);
  // }

  itemSelected($event: DeliveryEstablecimiento) {
    // console.log('establecimiento seleccionada', $event);

    // busca en el cache si ya calculo la distancia con la api de google
    // const _establecimientoCache = this.establecimientoService.getFindDirClienteCacheEstableciemto(this.direccionCliente, $event);
    // if ( _establecimientoCache.calcApiGoogle ) {
    //    this.calcDistanceService.calculateRoute(this.direccionCliente, $event, false);
    // }

    

    this.socketService.closeConnection();

    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(true);
    this.verifyClientService.setDataClient();
    
    this.infoTokenService.set();

    // console.log('establecimiento selected', $event);
    this.establecimientoService.set($event);

    // restcarta
    this.pedidoService.resetAllNewPedido();

    // console.log('this.infoClient', this.infoClient);
    if (!this.isClienteLogueado) { this.registarDirCliente(); return; }

    this.router.navigate(['/callback-auth']);

  }

  registarDirCliente() {
    this.verifyClientService.setIsDelivery(true);
    this.router.navigate(['/login-client']);
  }

  openDialogDireccion1() {
    // const dialogConfig = new MatDialogConfig();
    
    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.direccionCliente = data;
        this.direccionEntrega.establecer(this.direccionCliente);
        // this.setDireccion(data);
      }
    );
  }


  openDialogDireccion() {
    // if ( !this.isClienteLogueado ) {this.registarDirCliente(); return; }

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    _dialogConfig.data = {
      idcliente : this.infoClient.idcliente
    };

    const dialogDireccionCliente = this.dialogDireccion.open(DialogDireccionClienteDeliveryComponent, _dialogConfig);
    dialogDireccionCliente.afterClosed().subscribe((data: any) => {
      if ( !data ) { return; }
        // console.log('direcion', data);
        this.direccionCliente = data;
        // el dueño de la direccion la guarda y avisa; main repinta la cabecera, esconde
        // el cartel de "Indica direccion de entrega" y reemite por isChangeDireccionDelivery$
        this.direccionEntrega.establecer(this.direccionCliente);
    });

  }

  aplicarFitroSubCategoria(itemFiltro: any) {
    this.listSubCatFiltros.map(x => x.selected = false);
    itemFiltro.selected = true;

    // Isotope hace el resto: filtra por la categoria y desliza las tarjetas a su
    // nueva posicion. id 0 = todas.
    this.idFiltroCategoria = itemFiltro.id || 0;
    this.filtrarIsotope();
  }

  /** Deja solo las pastillas de categorias que tengan al menos un comercio en la
      lista actual. "Todos" y "buscar" (id 0) siempre quedan. Si la categoria
      seleccionada ya no existe, vuelve a "Todos". */
  private depurarCategoriasVacias(): void {
    if (!this.listSubCatFiltrosAll || this.listSubCatFiltrosAll.length === 0) { return; }

    const idsPresentes = new Set<string>();
    (this.listEstablecimientosMaster || []).forEach((e: DeliveryEstablecimiento) => {
      String(e.idsede_subcategoria || '').split(',').forEach(i => {
        const t = i.trim();
        if (t) { idsPresentes.add(t); }
      });
    });

    this.listSubCatFiltros = this.listSubCatFiltrosAll
      .filter(c => c.id === 0 || idsPresentes.has(String(c.id)));

    // si la categoria activa quedo fuera, volver a "Todos"
    const activa = this.listSubCatFiltros.find(c => c.selected && c.id !== 0);
    if (this.idFiltroCategoria !== 0 && !activa) {
      this.listSubCatFiltros.forEach(c => c.selected = false);
      const todos = this.listSubCatFiltros.find(c => c.id === 0 && c.descripcion === 'Todos');
      if (todos) { todos.selected = true; }
      this.idFiltroCategoria = 0;
    }
  }

  /** Clases de categoria de una tarjeta, p.ej. "cat-8 cat-3", para el filtro de Isotope. */
  clasesFiltro(item: DeliveryEstablecimiento): string {
    const sub = (item && item.idsede_subcategoria) ? String(item.idsede_subcategoria) : '';
    return sub.split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .map(i => 'cat-' + i)
      .join(' ');
  }

  /** Reconstruye Isotope tras (re)cargar la lista; espera un tick a que Angular pinte las celdas. */
  private reconstruirIsotope(): void {
    setTimeout(() => this.initIsotope(), 80);
  }

  private initIsotope(): void {
    const cont = this.gridComercios && this.gridComercios.nativeElement;
    if (!cont) { return; }
    this.destroyIsotope();
    this.iso = new Isotope(cont, {
      itemSelector: '.celda-comercio',
      percentPosition: true,
      transitionDuration: '0.4s',
      layoutMode: 'fitRows'
    });
    this.filtrarIsotope();
  }

  private filtrarIsotope(): void {
    if (!this.iso) { return; }
    // Isotope filtra por selector CSS: categoria por clase (.cat-N) y busqueda por
    // el atributo data-nombre. Se combinan en un solo selector. El texto se limpia
    // a letras/numeros/espacio para no romper el selector de atributo.
    const idCat = this.idFiltroCategoria;
    const texto = (this.textoFiltro || '').toLowerCase().trim().replace(/[^a-z0-9á-úñ ]/gi, '');
    const selCat = idCat === 0 ? '' : '.cat-' + idCat;
    const selTxt = texto ? '[data-nombre*="' + texto + '"]' : '';
    this.iso.arrange({ filter: (selCat + selTxt) || '*' });
  }

  private destroyIsotope(): void {
    if (this.iso) {
      try { this.iso.destroy(); } catch (e) { /* nada */ }
      this.iso = null;
    }
  }


  loadEstablecimientosPromos() {
    const _data = {
      ciudad: this.ciudad_actual // this.codigo_postal_actual, cambiamos el 310720
    };

    this.listPromociones = [];

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos-promos', false)
    .subscribe( (res: any) => {
      this.listPromociones = res.data.length > 0 ? res.data.filter(x => x.idpromocion && x.cerrado === 0) : [];
      });
  }


  /** Lee el filtro de subcategorias tolerando basura: si no es base64 de un arreglo, devuelve vacio. */
  private leerSubCategoriasGuardadas(): any[] {
    const guardado = localStorage.getItem('sys:subcat');
    if (!guardado) { return []; }

    try {
      const lista = JSON.parse(atob(guardado));
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }
}