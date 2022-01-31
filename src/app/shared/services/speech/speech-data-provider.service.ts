import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { EstablecimientoService } from '../establecimiento.service';
import { MipedidoService } from '../mipedido.service';
import { NavigatorLinkService } from '../navigator-link.service';
import { UtilitariosService } from '../utilitarios.service';

@Injectable({
  providedIn: 'root'
})
export class SpeechDataProviderService {

  // escucha comando navegacion seccion
  private commandNavegacionSeccionSource = new BehaviorSubject<SeccionModel>(null);
  public commandNavegacionSeccion$ = this.commandNavegacionSeccionSource.asObservable();

  private commandNavegacionRecomendadoSource = new BehaviorSubject<any>([]);
  public commandNavegacionRecomendado$ = this.commandNavegacionRecomendadoSource.asObservable();

  private commandAddItemSource = new BehaviorSubject<any>(null);
  public commandAddItem$ = this.commandAddItemSource.asObservable();

  // 1 = check 2 doble cheeck o beep
  private commandAceptadoSource = new BehaviorSubject<number>(0);
  public commandAceptado$ = this.commandAceptadoSource.asObservable();

  private commandFinalizarPedidoSource = new BehaviorSubject<boolean>(false);
  public commandFinalizarPedido$ = this.commandFinalizarPedidoSource.asObservable();

  private commandIsShowPedidoSource = new BehaviorSubject<boolean>(false);
  public commandIsShowPedido$ = this.commandIsShowPedidoSource.asObservable();


  // pedido confirmado enviado
  private isPedidoEnviadoSource = new BehaviorSubject<boolean>(false);
  public isPedidoEnviado$ = this.isPedidoEnviadoSource.asObservable();


  laCarta: any;
  arrStringSecciones: string;
  arrStringItems: string;

  constructor(
    private establecimientoService: EstablecimientoService,
    private miPedidoService: MipedidoService,
    private navigatorLinkService: NavigatorLinkService,
    private uttilService: UtilitariosService
  ) { }


  // ===== provee datos de seccion INCIO ======= //
  getNameSede() {
    return this.establecimientoService.get().nombre;
  }

  getIdSede() {
    return this.establecimientoService.get().idsede;
  }

  // ===== provee datos de seccion CARTA ======= //
  getSeccionesCarta(): string {
    let arrSeccines = '';

    if ( this.arrStringSecciones ) {  return this.arrStringSecciones; }
    // if ( !this.laCarta ) {this.getCarta(); }
    this.getCarta();

    arrSeccines += this.laCarta?.bodega ? this.laCarta.bodega.map(s => s.des).join(',') || '' + ',' : '';
    arrSeccines = this.laCarta.carta.map(c => c.secciones.map(s => s.des)).join(',');

    this.arrStringSecciones = arrSeccines;
    return arrSeccines;
  }

  getItemsCarta(): string {
    let arrItems = '';

    if ( this.arrStringItems ) {  return this.arrStringItems; }
    // if ( !this.laCarta ) {this.getCarta(); }
    this.getCarta();

    arrItems += this.laCarta?.bodega ? this.laCarta?.bodega.map(s => s.items.map(i => i.des)).join(',') || '' + ',' : '';
    arrItems = this.laCarta.carta.map(c => c.secciones.map(s => s.items.map(i => i.des))).join(',');

    this.arrStringItems = arrItems;
    return arrItems;
  }

  getItemsSeccionSelected(nameSeccion: string): string {
    let isSeccionBodega = true;
    nameSeccion = nameSeccion.toLowerCase();
    let _seccion = this.laCarta?.bodega.find(x => x.des.toLowerCase() === nameSeccion) || null;
    if ( !_seccion ) {
      isSeccionBodega = false;
      _seccion = this.laCarta.carta.map(c => c.secciones.find(s => s.des.toLowerCase() === nameSeccion));
    }

    // console.log('_seccion seleted', _seccion);
    return _seccion ? isSeccionBodega ?  _seccion.items.map(s => s.des).join(',') : _seccion.map(s => s.items.map(i => i.des)).join(',') || '' : '';

  }

  getItemsSeccionSelectedStr(seccion: any): string {
    return seccion.items.filter(x => x.cantidad !== '0').map(s => s.des).join(',');
  }

  getItemsRecomendadosStr(): string {
    if ( !this.laCarta ) {this.getCarta(); }
    return  this.laCarta.recomendados ? this.laCarta.recomendados.map(i => i.des).join(',') : null;
  }

  getISeccionSelected(nameSeccion: string): any {
    // let isSeccionBodega = true;
    nameSeccion = nameSeccion.toLowerCase();
    let _seccion = this.laCarta?.bodega ? this.laCarta?.bodega.find(x => x.des.toLowerCase() === nameSeccion) : null;
    if ( !_seccion ) {
      // isSeccionBodega = false;
      _seccion = this.laCarta.carta.map(c => c.secciones.find(s => s.des.toLowerCase() === nameSeccion))[0];
    }

    // console.log('_seccion seleted', _seccion);
    return _seccion;

  }

  getIItemsSelected(nameItem: string): any {
    // let isSeccionBodega = true;
    nameItem = nameItem.toLowerCase();
    let _item = this.laCarta?.bodega ? this.laCarta?.bodega.map(x => x.items.find(i => i.des.toLowerCase() === nameItem)).find(x => x) : null;
    if ( !_item ) {
      // isSeccionBodega = false;
      _item = this.laCarta.carta.map(c => c.secciones.map(s => s.items.find(i => i.des.toLowerCase() === nameItem)))[0].find(x => x);
    }

    // console.log('_item seleted', _item);
    return _item;

  }

  getCarta() {
    this.laCarta = this.miPedidoService.getObjCarta();
    // console.log('this.laCarta', this.laCarta);
  }

  getIsPedidoValido() {
    const _miPedido = this.miPedidoService.getMiPedido();

    return _miPedido ? true : false;
  }


  // =========== COMANDOS NAVEGACION EN LA CARTA ==== //////////////////////////////////
  goNavegacionSeccionCarta(seccion: any) {
    this.commandNavegacionSeccionSource.next(seccion);
    this.goNavigacionShowCarta();
  }

  goNavegacionItemRecomendados() {
    const _recomendados = this.laCarta.recomendados;
    this.commandNavegacionRecomendadoSource.next(_recomendados);
    this.goNavigacionShowCarta();
  }

  goNavigacionShowMiPedido() {
    this.navigatorLinkService.setPageActive('mipedido');
    this.commandIsShowPedidoSource.next(true);
  }

  goNavigacionShowCarta() {
    this.navigatorLinkService.setPageActive('carta');
  }

  // goNavigacionShowPedidoConfirma() {
  //   this.navigatorLinkService.setPageActive('mipedido-confirma');
  // }


  // ============ para agregar item === //
  addItemPedido(item: any) {
    this.commandAddItemSource.next(item);
  }

  setIsCommandAceptado(val: number) {
    this.commandAceptadoSource.next(val);
  }

  setFinalizarPedido(val: boolean) {
    this.commandFinalizarPedidoSource.next(val);
  }

  setIsPedidoConfirmado() {
    this.isPedidoEnviadoSource.next(true);
  }

  // = indiciaciones
  setIndicaciones(item: any, val: string): void {
    item.indicaciones = this.uttilService.addslashes(val);
    // this.item.indicaciones = val;

    // let isItemSubISelected = false;
    // if ( this.isObjSubItems ) {
    //   isItemSubISelected = this.item.subitems_selected?.length > 0;
    // }

    // agrega las indicaciones si existe en mipedido y si no tienen subitems
    const _itemFromPedido = this.miPedidoService.findOnlyItemMiPedido(item);
    if (_itemFromPedido) {
      _itemFromPedido.indicaciones = val;
    }

    // if ( _itemFromPedido && !isItemSubISelected ) {
    //   _itemFromPedido.indicaciones = val;
    // }

    this.miPedidoService.setLocalStoragePedido();
  }


}
