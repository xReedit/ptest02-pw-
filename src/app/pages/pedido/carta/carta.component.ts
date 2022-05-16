import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, Input } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { ItemTipoConsumoModel } from 'src/app/modelos/item.tipoconsumo.model';
import { ReglascartaService } from 'src/app/shared/services/reglascarta.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogItemEditComponent } from 'src/app/componentes/dialog-item-edit/dialog-item-edit.component';

// import { Subscription } from 'rxjs/internal/Subscription';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { URL_IMG_CARTA } from 'src/app/shared/config/config.const';
import { Subscription } from 'rxjs';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DialogCalificacionSedeComponent } from 'src/app/componentes/dialog-calificacion-sede/dialog-calificacion-sede.component';
import { SpeechDataProviderService } from 'src/app/shared/services/speech/speech-data-provider.service';
import { CocinarPromoShowService } from 'src/app/shared/services/promo/cocinar-promo-show.service';



@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css', '../pedido.style.css']
})
export class CartaComponent implements OnInit, OnDestroy, AfterViewInit {

  private unsubscribeCarta = new Subscription();
  // private destroyCarta$: Subject<boolean> = new Subject<boolean>();
  // objCartaCarta: any;
  objCartaBus: any = [];
  isBusqueda = false;
  rutaImgItem = URL_IMG_CARTA;
  imgNull = './assets/images/icon-app/img-null.png';
  private isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  // max_minute_order = MAX_MINUTE_ORDER;
  // time = new Date();

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];
  objPromociones: any = null;
  private categoriaSeleted: CategoriaModel;

  // objSelectedItem: ItemModel;
  // objSeccionSelected: SeccionModel = new SeccionModel();

  // listItemsPedido: ItemModel[] = [];
  // miPedido: PedidoModel = new PedidoModel();

  private tiposConsumo: TipoConsumoModel[] = [];
  private objItemTipoConsumoSelected: ItemTipoConsumoModel[];
  private objNewItemTiposConsumo: ItemTipoConsumoModel[] = [];
  private itemSelected: ItemModel;
  private seccionSelected: SeccionModel;
  private countSeeBack = 2; // primera vista al dar goback
  private nomCategoriaSeleted = '';

  private destroy$: Subject<boolean> = new Subject<boolean>();

  private isFirstLoadListen = false; // si es la primera vez que se carga, para no volver a cargar los observables


  // tamaño de la pamtalla
  isScreenIsMobile = true;

  isViewMercado = false;
  isShowCalificacion = false;
  isCliente = false;
  isPuntoAutoPedido = false;
  isTomaPedidoRapido = false;
  canalConsumoTomaPedidoRapido: any;
  dataCalificacion: any;

  isCantidadCero = true;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.detectScreenSize();
  }



  constructor(
      private socketService: SocketService,
      public miPedidoService: MipedidoService,
      private reglasCartaService: ReglascartaService,
      // private jsonPrintService: JsonPrintService,
      private navigatorService: NavigatorLinkService,
      private listenStatusService: ListenStatusService,
      private infoToken: InfoTockenService,
      private dialog: MatDialog,
      private establecimientoService: EstablecimientoService,
      private calcDistanciaService: CalcDistanciaService,
      private crudService: CrudHttpService,
      private speechDataProviderService: SpeechDataProviderService,
      private cocinarPromoShowService: CocinarPromoShowService,
      ) {

  }

  private detectScreenSize() {
    this.isScreenIsMobile = window.innerWidth > 599 ? false : true;
    // console.log(' window.innerWidth',  window.innerWidth);
    // console.log(' this.isScreenIsMobile',  this.isScreenIsMobile);
  }

  ngOnInit() {
    this.detectScreenSize();
    // this.initCarta();

    const _configPunto = JSON.parse(localStorage.getItem('sys::punto')) || {};
    // console.log('this.establecimientoService.get()', this.establecimientoService.get());
    this.isViewMercado = this.establecimientoService.get().pwa_show_item_view_mercado === 1;
    this.isCliente = this.infoToken.infoUsToken.isCliente;
    this.isPuntoAutoPedido = _configPunto.ispunto_autopedido || false;
    this.isTomaPedidoRapido = _configPunto.istoma_pedido_rapido || false;

    if ( this.isTomaPedidoRapido ) {
      this.canalConsumoTomaPedidoRapido = _configPunto?.canal_consumo;
    }

    this.initCarta();
    // console.log('this.establecimientoService.get()', this.establecimientoService.get());

    // calificacion y comentarios
    this.isShowCalificacion = this.establecimientoService.get().calificacion >= 3.7;
    if ( this.isShowCalificacion ) {
      this.dataCalificacion = {
        calificacion: this.establecimientoService.get().calificacion,
        cantidad: 0,
        listCalificacion: []
      };

      const _dataSendCalificacion = {
        idsede: this.establecimientoService.get().idsede
      };

      this.crudService.postFree(_dataSendCalificacion, 'delivery', 'get-calificacion-sede', false)
      .subscribe((res: any) => {
        this.dataCalificacion.listCalificacion = res.data;
        this.dataCalificacion.cantidad = this.dataCalificacion.listCalificacion.map(c => c.numpedidos).reduce((a, b) => a + b, 0);
      });
    }

    if ( this.infoToken.getInfoUs().isCliente &&  !this.infoToken.getInfoUs().isReserva) {
      // console.log('calcula distancia desde carta');
      this.calcDistanciaService.calcCostoEntregaApiGoogleRain(this.infoToken.getInfoUs().direccionEnvioSelected, this.establecimientoService.get());
    }
  }

  ngAfterViewInit() {
    // this.initCarta();
  }

  initCarta() {
    this.isCargado = true;
    this.socketService.connect();
    // console.log('loader carta');
    this.listenStatusService.setLoaderCarta(true);

    this.listeStatusBusqueda();

    // descarga la constate del items scala delivery // tanto para cliente como para usuario
    // if ( this.infoToken.isDelivery() ) {
      if ( !this.infoToken.isReserva() ) {
        this.miPedidoService.getDeliveryConstCantEscala();
      }
    // }

    this.unsubscribeCarta = this.navigatorService.resNavigatorSourceObserve$.subscribe((res: any) => {

      if (res.pageActive === 'carta') {
        if (this.countSeeBack < 2) { this.countSeeBack++; return; }
        this.goBack();
      } else {
        this.countSeeBack = 0;
      }
    });

    // console.log('aaa');
    this.establecimientoService.getComsionEntrega();
    // if (!this.socketService.isSocketOpen) {
      this.unsubscribeCarta = this.socketService.onGetCarta().subscribe((res: any) => {

        // console.log('onGetCarta', res);
        // this.objCartaCarta = {
        //   'carta': <CartaModel[]>res[0].carta,
        //   'bodega': <SeccionModel[]>res[0].bodega
        // };
        this.listenStatusService.setLoaderCarta(false);
        // console.log('cerrar loader carta');

        if (this.socketService.isSocketOpenReconect) {
          // actualizar cantidad actual (stock actual) de ObjCarta del item
          // if ( !this.miPedidoService.findIsHayItems() ) {
          //   this.miPedidoService.updatePedidoFromStrorage();
          // }

            // this.objCartaCarta = res;
            //
            this.miPedidoService.setObjCarta(res);

            this.resetParamsCarta();

            if ( this.miPedidoService.findIsHayItems() ) {
              this.miPedidoService.updatePedidoFromStrorage();
            }

            // console.log('objCartaCarta desde socket reconect');
            this.navigatorService.setPageActive('carta');
          // }

          return;
        }
        // this.objCartaCarta = res;
        //
        this.miPedidoService.setObjCarta(res);

        if ( this.miPedidoService.objCarta.promociones ) {
          if ( this.miPedidoService.objCarta.promociones.lista_promociones ) {
          // if (this.miPedidoService.objCarta.promociones[0].idpromocion) {
            this.objPromociones = this.miPedidoService.objCarta.promociones.lista_promociones;
            // filtramos si hay solo app
            if (!this.isCliente) {
              this.objPromociones = this.objPromociones.filter(p => p.parametros.body.solo_app === 0);
            }
            this.cocinarPromoShowService.iniReloadOpenPromo(this.objPromociones);
          }
          // }
        }
        // console.log('this.objPromociones', this.objPromociones);

        this.resetParamsCarta();

        // this.isCargado = false;
        // // this.showCategoria = true;

        // this.objSecciones = [];
        // this.objItems = [];
        // this.showCategoria = false;
        // this.showSecciones = false;
        // this.showItems = false;
        // this.showCategoria = true;


        this.miPedidoService.clearPedidoIsLimitTime();
        this.miPedidoService.updatePedidoFromStrorage();

        // restaurar cuenta de timepo limite
        // console.log('restore timer limt');
        this.miPedidoService.restoreTimerLimit();

        this.loadItemsBusqueda();

        if ( this.isFirstLoadListen ) {return; }
        this.isFirstLoadListen = true; // para que no vuelva a cargar los observables cuando actualizan desde sockets
        this.miPedidoService.listenChangeCantItem(); // cuando se reconecta para que actualize
      });

      // tipo de consumo
      this.unsubscribeCarta = this.socketService.onGetTipoConsumo().subscribe((res: TipoConsumoModel[]) => {
        // console.log('tipo consumo ', res);
        if (this.socketService.isSocketOpenReconect) {return; }
        this.tiposConsumo = res;

        // set tipos de consumo a new item tipo cosnumo para los item vista
        this.tiposConsumo.map((t: TipoConsumoModel) => {
          const _objTpcAdd = new ItemTipoConsumoModel();
          _objTpcAdd.descripcion = t.descripcion;
          _objTpcAdd.idtipo_consumo = t.idtipo_consumo;
          _objTpcAdd.titulo = t.titulo;
          _objTpcAdd.idimpresora = t.idimpresora;

          // filtramos los tipos de consumo segun qr escaneado o personal autorizado


          if ( this.infoToken.isCliente() ) {
            if ( !this.infoToken.isDelivery() ) {
              if ( t.descripcion === 'DELIVERY' ) { return; }
              if ( this.infoToken.isSoloLlevar() && t.descripcion.indexOf('LLEVAR') === -1 ) { return; }
            } else {
              if ( t.descripcion !== 'DELIVERY' ) { return; } else {_objTpcAdd.descripcion = 'CANTIDAD'; }
            }
          }

          if ( this.infoToken.isPuntoAutoPedido()  ) {
            // solo para llevar
            if ( t.descripcion.indexOf('LLEVAR') === -1 ) { return; }
          }

          // if ( this.infoToken.isCliente() && t.descripcion === 'DELIVERY' ) {

          // } else {
            this.objNewItemTiposConsumo.push(_objTpcAdd);
          // }
        });

        // console.log('this.objNewItemTiposConsumo', this.objNewItemTiposConsumo);

        this.miPedidoService.setObjNewItemTiposConsumo(this.objNewItemTiposConsumo);

        this.navigatorService.addLink('carta-i-');

        // console.log('this.objNewItemTiposConsumo', this.objNewItemTiposConsumo);
        // this.tiposConsumo.secciones = [];

        // this.loadItemsBusqueda();

        this.initFirtsCategoria();
      });


      // descuentos
      this.unsubscribeCarta = this.socketService.onGetDataSedeDescuentos().subscribe((res: any) => {
        // console.log('onGetDataSedeDescuentos', res);
        // console.log('infoToken', this.infoToken.infoUsToken);
        this.miPedidoService.setObjCartaDescuentos(res);
      });

    // }

    // reglas de la carta y subtotales
    this.reglasCartaService.loadReglasCarta();

    // this.miPedidoService.listenChangeCantItem();

    // datos de la sede, impresoras
    // this.jsonPrintService.getDataSede();
  }

  // si la carta solo tiene un categoria ( cena almuerzo entra de frente)
  private initFirtsCategoria() {
    // if ( this.isScreenIsMobile ) {return; }
    if ( this.miPedidoService.objCarta.carta.length === 1 ) {
      this.objSecciones = this.miPedidoService.objCarta.carta[0].secciones;
      this.tituloToolBar = this.miPedidoService.objCarta.carta[0].des;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      // if ( this.isScreenIsMobile ) {
        this.getSecciones(this.miPedidoService.objCarta.carta[0]);
        // return; }

      if ( !this.isScreenIsMobile ) {
        this.getItems(this.objSecciones[0]);
      }

      // seleciona la primera seccion
      this.objItems = this.objSecciones[0].items;
    }

    // if ( this.miPedidoService.objCarta.promociones.length !== 0 ) {
    //   this.objPromociones = this.miPedidoService.objCarta.promociones;
    // }
    // console.log('this.miPedidoService.objCarta.carta;', this.miPedidoService.objCarta.carta);
  }


  // al obtener la carta
  private resetParamsCarta(): void {
    this.isCargado = false;
    this.objSecciones = [];
    this.objItems = [];
    // this.showCategoria = false;
    this.showSecciones = false;
    this.showItems = false;
    this.showToolBar = false;
    this.showCategoria = true;
  }

  ngOnDestroy(): void {
    // console.log('======= unsubscribe ======= ');
    this.unsubscribeCarta.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
  }

  getSecciones(categoria: CategoriaModel) {
    this.categoriaSeleted = categoria;
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      // local storage categoria
      localStorage.setItem('sys::cat', categoria.idcategoria.toString());

      this.tituloToolBar = categoria.des;
      this.nomCategoriaSeleted = categoria.des;
      this.navigatorService.addLink('carta-i-secciones');
    }, 250);
  }

  getItems(seccion: SeccionModel) {
    this.miPedidoService.setObjSeccionSeleced(seccion);
    setTimeout(() => {
      this.seccionSelected = seccion;
      this.objItems = seccion.items;
      this.showSecciones = false;
      this.showItems = true;
      if ( this.isScreenIsMobile ) {
        // if ( this.tituloToolBar.indexOf(seccion.des) === -1) {
          this.tituloToolBar = this.nomCategoriaSeleted + ' / ' + seccion.des;
        // }
      }

      // console.log('this.objItems', this.objItems);

      this.navigatorService.addLink('carta-i-secciones-items');
    }, 150);

  }

  getItemsPromo(items: ItemModel[]) {
    setTimeout(() => {
      this.objItems = items;
      this.showSecciones = false;
      this.showItems = true;
      this.navigatorService.addLink('carta-i-secciones-items');
    }, 150);
  }

  private getItems_seccion_from_busqueda(_itemBus: any): any {
    const _seccionBus = {
      des: _itemBus.seccion,
      idseccion: _itemBus.idseccion,
      idimpresora: _itemBus.idimpresora,
      sec_orden: _itemBus.sec_orden,
      ver_stock_cero: _itemBus.ver_stock_cero,
    };

    this.miPedidoService.setObjSeccionSeleced(<SeccionModel>_seccionBus);
  }


  /// busqueda
  loadItemsBusqueda() {
    let _objFind: any;
    // _objFind = this.miPedidoService.getObjCartaLibery();
    _objFind = this.miPedidoService.getObjCarta();

    // extraemos
    let _itemFind: any;
    if ( !_objFind.carta ) { return; }
    _objFind.carta.map((c: CategoriaModel) => {
      c.secciones.map((s: SeccionModel) => {
        s.items.map((i: ItemModel) => {
          _itemFind = i;
          _itemFind.seccion = s.des;
          _itemFind.idimpresora = s.idimpresora;
          _itemFind.sec_orden = s.sec_orden;
          _itemFind.ver_stock_cero = s.ver_stock_cero;
          _itemFind.selected = false;
          _itemFind.visible = true;
          this.objCartaBus.push(_itemFind);
        });
      });
    });

    // reset busqueda
    window.localStorage.setItem('sys::find', '');
    // tipo consumo
    // console.log('_objFind', this.objCartaBus);
  }



  goBack() {

    try {
      if ( this.miPedidoService.objCarta.carta.length === 1 && !this.isScreenIsMobile ) {return; } // si no es celular no regresa
    } catch (error) {}

    this.objItems.map(x => x.selected = false);
    if (this.showItems) {
      this.showItems = false;
      this.showSecciones = true;
      this.tituloToolBar = this.tituloToolBar.split(' / ')[0];
      // this.navigatorService.addLink('carta-i-secciones');
      return;
    }
    if (this.showSecciones) {
      this.showSecciones = false; this.showToolBar = false; this.showCategoria = true;
      // this.navigatorService.addLink('carta-i-');
    }
  }

  selectedItem(_selectedItem: ItemModel, openDetalle = false) {
    // if (!this.isBusqueda) {
    //   this.objItems.map(x => x.selected = false);
    // } else {
    //   this.objCartaBus.map(x => x.selected = false);
    // }

    // console.log('_selectedItem', _selectedItem);

    if ( (this.isPuntoAutoPedido || this.isTomaPedidoRapido || this.isCliente) && !openDetalle && _selectedItem?.count_subitems === 0 ) {
      if ( !this.isViewMercado ) {
        this.resultCantItemMercado(_selectedItem, true);
        return;
      }
    }

    if ( _selectedItem.cantidad.toString() === '0' && !_selectedItem.cantidad_seleccionada ) { return; }

    _selectedItem.selected = true;
    this.itemSelected = _selectedItem;

    const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
    this.objItemTipoConsumoSelected = _selectedItem.itemtiposconsumo ? _selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;

    if ( !_selectedItem.itemtiposconsumo ) {
      _selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    // confirma que la seccion del item sea igual a la seccion del // si viene x ej de promo
    const idSeccionSelected = this.seccionSelected?.idseccion || 0;
    const _lastSeccionObjSeleted = this.miPedidoService.getObjSeccionSeleced();
    const _reasignarSeccion = _lastSeccionObjSeleted.idseccion !== idSeccionSelected;
    if ( this.itemSelected.idseccion !== idSeccionSelected || _reasignarSeccion) {
      this.seccionSelected = this.miPedidoService.findItemSeccionCarta(this.itemSelected.idseccion);
      this.miPedidoService.setObjSeccionSeleced(this.seccionSelected);
    }



    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);

    this.openDlgItem(_selectedItem);
  }

  // abrir el dialog item
  private openDlgItem(_item: ItemModel): void {
    const dialogConfig = new MatDialogConfig();
    const _itemFromCarta = _item.ispromo ? _item : this.miPedidoService.findItemCarta(_item);
    if ( !_itemFromCarta.itemtiposconsumo ) {
      _itemFromCarta.itemtiposconsumo = _item.itemtiposconsumo;
    }
    // const _seccionItemSelect = this.miPedidoService.findItemSeccionCarta(_itemFromCarta.idseccion);

    dialogConfig.autoFocus = false;
    dialogConfig.data = {
      idTpcItemResumenSelect: null,
      seccion: !this.isBusqueda ? this.seccionSelected : this.miPedidoService.findItemSeccionCarta(_itemFromCarta.idseccion),
      item: _itemFromCarta,
      objItemTipoConsumoSelected: this.itemSelected.itemtiposconsumo
    };
    dialogConfig.panelClass =  ['my-dialog-orden-detalle', 'margen-0', 'my-dialog-item-producto'];

    const dialogRef = this.dialog.open(DialogItemEditComponent, dialogConfig);

    // subscribe al cierre y obtiene los datos
    dialogRef.afterClosed().subscribe(
        data => {
          if ( !data ) { return; }
          // console.log('data dialog', data);
        }
    );

  }


  addItemToPedido(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, suma);
  }

  addItemToPedidoFromBusqueda(tpcSelect: ItemTipoConsumoModel, suma: number): void {
    // setea la seccion del item
    this.getItems_seccion_from_busqueda(this.itemSelected);

    // agrega el item
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, suma);
  }

  addItemIndicaciones(itemCarta: ItemModel, _indicaciones: string): void {
    // console.log('indicaciones', _indicaciones);
    this.itemSelected.indicaciones = _indicaciones;
    itemCarta.indicaciones = _indicaciones;

    // const _itemInMipedido = this.miPedidoService.findOnlyItemMiPedido(itemCarta);
    // if ( _itemInMipedido ) {
    //   _itemInMipedido.indicaciones = _indicaciones;
    // }
  }

  getEstadoStockItem(stock: any): string {
    if ( stock === 'ND' || isNaN(stock) ) {
      // stock = 'ND';
      return 'verde';
    } else {
      const _stock = parseInt(stock, 0);
      return _stock > 10 ? 'verde' : _stock > 5 ? 'amarillo' : 'rojo';
    }
  }

  private listeStatusBusqueda(): void {
    this.listenStatusService.isBusqueda$.subscribe(res => {
      this.isBusqueda = res;
    });

    this.listenStatusService.charBuqueda$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: string) => {
      this.isBusquedaFindNow(res);
    });

    this.socketService.isSocketOpen$
    .pipe(takeUntil(this.destroy$))
    .subscribe(res => {
      if (!res) {
        // console.log('===== unsubscribe unsubscribe Carta =====');
        this.unsubscribeCarta.unsubscribe();
      }
    });


    // ===== COMANDOS DE VOZ =========== //
    // listen comando voz navegacion;
    this.speechDataProviderService.commandNavegacionSeccion$
    .pipe(takeUntil(this.destroy$))
    .subscribe((rpt_seccion: SeccionModel) => {
      if (rpt_seccion) {
        // if (this.showCategoria ) {
          const _categoria = this.miPedidoService.objCarta.carta[0];
          this.getSecciones(_categoria);
          setTimeout(() => {
            this.getItems(rpt_seccion);
          }, 100);
        // } else {
        //   this.getItems(rpt_seccion);
        // }
      }
    });

    // listen comando voz navegacion;
    this.speechDataProviderService.commandNavegacionRecomendado$
    .pipe(takeUntil(this.destroy$))
    .subscribe((itemsRecomendados: any) => {
      if (itemsRecomendados.length > 0) {
          this.getItemsPromo(itemsRecomendados);
      }
    });

    // escuhar si se aumenta pedido
    this.speechDataProviderService.commandAddItem$
    .pipe(takeUntil(this.destroy$))
    .subscribe((itemVoz: any) => {
      if (itemVoz) {
        this.resultCantItemMercado(itemVoz.item, itemVoz.isSuma);
      }
    });


    // ===== COMANDOS DE VOZ =========== //
  }

  private isBusquedaFindNow(charFind: string): void {
    charFind = charFind.toLowerCase();
    // console.log(charFind);
    let _charConcat = '';
    this.objCartaBus.map((i: any) => {
      _charConcat = `${i.des} ${i.seccion} ${i.detalles}`;
      _charConcat = _charConcat.toLowerCase();
      i.visible = _charConcat.indexOf(charFind) > -1 ? true : false;
    });
  }

  getObjDetalleSeccion(seccion: SeccionModel): String {
    let resp = '';
    if (seccion.items === null ) {return; }
    seccion.items.map((i: ItemModel, index: number) => {
      if (index > 5) {return; }
      resp += i.des.toLowerCase() + ', ';
    });

    return resp.slice(0, -2);
  }

  resultCantItemMercado(_selectedItem: any, isSuma_selected = false) {
    // solo para delivery
    // isSuma_selected viene de agregar al clic
    this.itemSelected = _selectedItem;

    // busca el canal consumo predeteminado
    // if ( this.isTomaPedidoRapido ) {
    //   this.objItemTipoConsumoSelected = this.canalConsumoTomaPedidoRapido;
    // } else {
      const _objNewItemTiposConsumo = JSON.parse(JSON.stringify(this.objNewItemTiposConsumo));
      this.objItemTipoConsumoSelected = _selectedItem.itemtiposconsumo ? _selectedItem.itemtiposconsumo : _objNewItemTiposConsumo;
    // }

    if ( !_selectedItem.itemtiposconsumo ) {
      _selectedItem.itemtiposconsumo = this.objItemTipoConsumoSelected;
    }

    this.miPedidoService.setobjItemTipoConsumoSelected(this.objItemTipoConsumoSelected);
    let tpcSelect =  this.objItemTipoConsumoSelected[0];
    if ( this.isTomaPedidoRapido ) {
      tpcSelect = this.objItemTipoConsumoSelected.filter(x => x.descripcion.toLocaleLowerCase() === this.canalConsumoTomaPedidoRapido.descripcion.toLocaleLowerCase())[0];
    }
    const _isSuma = isSuma_selected ? 0 : _selectedItem.isSuma_selected ? 0 : 1;


    // confirma que la seccion del item sea igual a la seccion del
    const idSeccionSelected = this.seccionSelected?.idseccion || 0;
    const _lastSeccionObjSeleted = this.miPedidoService.getObjSeccionSeleced();
    const _reasignarSeccion = _lastSeccionObjSeleted.idseccion !== idSeccionSelected;
    if ( this.itemSelected.idseccion !== idSeccionSelected || _reasignarSeccion) {
      this.seccionSelected = this.miPedidoService.findItemSeccionCarta(this.itemSelected.idseccion);
      this.miPedidoService.setObjSeccionSeleced(this.seccionSelected);
    }

    // console.log('_selectedItem carta', _selectedItem);
    this.miPedidoService.addItem2(tpcSelect, this.itemSelected, _isSuma);

    _selectedItem.is_visible_control_last_add = _selectedItem.cantidad_seleccionada !== 0;
  }

  // addSubItem(subitem: SubItem): void {
  //   // subitem.selected = !subitem.selected;

  //   // if ( subitem.selected ) {
  //     // const listSubItemChecked = this.itemSelected.subitems.filter((x: SubItem) => x.selected);
  //     // let countSelectReq = listSubItemChecked.length;

  //     // // adicional el importe al precio del item
  //     // this.itemSelected.precio = this.itemSelected.precio_unitario + subitem.precio;
  //     // // this.itemSelected.precio_total = parseFloat(this.itemSelected.precio);


  //     // listSubItemChecked.map( (_subItem: SubItem, i: number) =>  {
  //     //   if (countSelectReq > this.itemSelected.subitem_cant_select && _subItem !== subitem) {
  //     //     _subItem.selected = false;
  //     //     countSelectReq--;
  //     //   }
  //     // });


  //   // }
  // }


  openDialogComentarios() {
    const dialogConfig = new MatDialogConfig();

    // dialogConfig.panelClass = 'dialog-item-edit';
    dialogConfig.autoFocus = false;
    dialogConfig.data = this.dataCalificacion;
    dialogConfig.panelClass =  ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    const dialogRef = this.dialog.open(DialogCalificacionSedeComponent, dialogConfig);

    // subscribe al cierre y obtiene los datos
    dialogRef.afterClosed().subscribe(
        data => {
          if ( !data ) { return; }

        }
    );
  }


  showItemsPromo(promo: any) {
    // if ( this.cocinarPromoShowService.consultarPromoAbierto(promo) ) {
      const itemsPromo = this.cocinarPromoShowService.promoFilterShow(promo, this.categoriaSeleted);
      this.getItemsPromo(itemsPromo);
    // } else {
    //   promo.abierto = 0;
    //   console.log('aaaaaaaaaaaaaa');
    // }
  }

}
