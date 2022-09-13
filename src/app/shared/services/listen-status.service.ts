import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { EstadoPedidoModel } from 'src/app/modelos/estado.pedido.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';

@Injectable({
  providedIn: 'root'
})
export class ListenStatusService {

  // para activar la busqueda
  private isBusquedaSource = new BehaviorSubject<boolean>(false);
  public isBusqueda$ = this.isBusquedaSource.asObservable();

  // string a buscar
  private charBuquedaSource = new BehaviorSubject<string>('');
  public charBuqueda$ = this.charBuquedaSource.asObservable();

  // hay items en la busqueda - se encontro cuenta
  private hayCuentaBusquedaSource = new BehaviorSubject<boolean>(false);
  public hayCuentaBusqueda$ = this.hayCuentaBusquedaSource.asObservable();

  // datos de la sede estan disponible
  private hayDatosSedeSource = new BehaviorSubject<boolean>(false);
  public hayDatosSede$ = this.hayDatosSedeSource.asObservable();

  // si es cliente usuario
  private isUsuarioClienteSource = new BehaviorSubject<boolean>(false);
  public isUsuarioCliente$ = this.isUsuarioClienteSource.asObservable();

  // estado del pedido enviado por el cliente
  private estadoPedidoSource = new BehaviorSubject<EstadoPedidoModel>(new EstadoPedidoModel());
  public estadoPedido$ = this.estadoPedidoSource.asObservable();

  // hay pedido en el storage, si es cliente usuario no cargar al cuenta.
  private hayPedidoPendienteSource = new BehaviorSubject<boolean>(false);
  public hayPedidoPendiente$ = this.hayPedidoPendienteSource.asObservable();

  // form pagar la cuenta
  private isPagePagarCuentaShowSource = new BehaviorSubject<boolean>(false);
  public isPagePagarCuentaShow$ = this.isPagePagarCuentaShowSource.asObservable();

  // si el boton de pago ha sido visible // recargamos la pagina al volver a ingresar
  private isBtnPagoShowSource = new BehaviorSubject<boolean>(false);
  public isBtnPagoShow$ = this.isBtnPagoShowSource.asObservable();

  // notifica el pago correcto para enviar el pedido cuando es solo para llevar
  private isPagoSuccesSource = new BehaviorSubject<boolean>(false);
  public isPagoSucces$ = this.isPagoSuccesSource.asObservable();

  private isChangeDireccionDeliverySource = new BehaviorSubject<DeliveryDireccionCliente>(null);
  public isChangeDireccionDelivery$ = this.isChangeDireccionDeliverySource.asObservable();


  // notifica salir del establecimeinto cuando es cliente delivery goback
  private isOutEstablecimientoDeliverySource = new BehaviorSubject<boolean>(false);
  public isOutEstablecimientoDelivery$ = this.isOutEstablecimientoDeliverySource.asObservable();

  // si es visible el footer de zona delivery
  private isShowFooterZonaDeliverySource = new BehaviorSubject<boolean>(true);
  public isShowFooterZonaDelivery$ = this.isShowFooterZonaDeliverySource.asObservable();

  private isLoaderSendPedidoSource = new BehaviorSubject<boolean>(false);
  public isLoaderSendPedido$ = this.isLoaderSendPedidoSource.asObservable();

  private isFinishLoaderSendPedidoSource = new BehaviorSubject<boolean>(false);
  public isFinishLoaderSendPedido$ = this.isFinishLoaderSendPedidoSource.asObservable();

  private isLoaderCartaSource = new BehaviorSubject<boolean>(false);
  public isLoaderCarta$ = this.isLoaderCartaSource.asObservable();

  // observable del metodo de pago seleccionado
  private elMetodoPagoSelectedSource = new BehaviorSubject<MetodoPagoModel>(new MetodoPagoModel());
  public elMetodoPagoSelected$ = this.elMetodoPagoSelectedSource.asObservable();

  // observable page show atm
  private numberPageShowAtmSoruce = new BehaviorSubject<number>(0);
  public numberPageShowAtm$ = this.numberPageShowAtmSoruce.asObservable();

  // observable ver la cuenta de mesa seleccionada desde fuera de mi pedido
  private showCuentaMesaNumeroSoruce = new BehaviorSubject<number>(0);
  public showCuentaMesaNumero$ = this.showCuentaMesaNumeroSoruce.asObservable();


  // llama a cargar lista de mesas en componente
  private showLoadListMesasSource = new BehaviorSubject<boolean>(false);
  public showLoadListMesas$ = this.showLoadListMesasSource.asObservable();

  // back carta
  private listenGoBackCartaSource = new BehaviorSubject<boolean>(false);
  public listenGoBackCarta$ = this.listenGoBackCartaSource.asObservable();

  // observable lista cliente solicita atencion
  // private callClienteSolicitaAtencionSoruce = new BehaviorSubject<string>('');
  // public callClienteSolicitaAtencion$ = this.callClienteSolicitaAtencionSoruce.asObservable();

  // observable atm cash -> pago tarjeta
  // private isDataFromCashAtmSoruce = new BehaviorSubject<any>({});
  // public isDataFromCashAtm$ = this.isDataFromCashAtmSoruce.asObservable();


  constructor() { }

  setIsBusqueda() {
    if ( !this.isBusquedaSource.value ) {
      setTimeout(() => {
        this.isBusquedaSource.next(true);
      }, 250);
    } else {
      this.isBusquedaSource.next(false);
    }
  }

  setCharBusqueda(charFind: string) {
    this.charBuquedaSource.next(charFind);
  }

  setHayCuentaBuesqueda(value: boolean): void {
    this.hayCuentaBusquedaSource.next(value);
  }

  setHayDatosSede(value: boolean): void {
    this.hayDatosSedeSource.next(value);
  }

  setIsUsuarioCliente(value: boolean): void {
    this.isUsuarioClienteSource.next(value);
  }

  setEstadoPedido(value: EstadoPedidoModel): void {
    this.estadoPedidoSource.next(value);
  }

  setHayPedidoPendiente(value: boolean): void {
    this.hayPedidoPendienteSource.next(value);
  }

  setIsPagePagarCuentaShow(value: boolean) {
    this.isPagePagarCuentaShowSource.next(value);
  }

  setIsBtnPagoShow(value: boolean) {
    this.isBtnPagoShowSource.next(value);
  }

  setPagoSuccess(value: boolean) {
    this.isPagoSuccesSource.next(value);
  }

  setChangeDireccionDelivery(value: DeliveryDireccionCliente) {
    this.isChangeDireccionDeliverySource.next(value);
  }

  setIsOutEstablecimientoDelivery(value: boolean) {
    this.isOutEstablecimientoDeliverySource.next(value);
  }

  setIsShowFooterZonaDelivery(value: boolean) {
    this.isShowFooterZonaDeliverySource.next(value);
  }

  setLoaderSendPedido(value: boolean, isClienteReadQr: boolean = false) {
    // if ( isClienteReadQr ) { // si es cliente mozo virtual QR
      if ( value ) { // open
        this.isLoaderSendPedidoSource.next(value);
      } else { // close
        // aca muestra el mensaje de pedido enviado
        this.isFinishLoaderSendPedidoSource.next(true);
      }
    // } else {
    //   this.isLoaderSendPedidoSource.next(value);
    // }
  }

  setIsFinishLoaderSendPedidoSource(value: boolean) {
    this.isFinishLoaderSendPedidoSource.next(value);
  }

  closeFinishLoaderSendPedidoSource() {
    this.isLoaderSendPedidoSource.next(false);
    this.isFinishLoaderSendPedidoSource.next(false);
  }

  setLoaderCarta(value: boolean) {
    this.isLoaderCartaSource.next(value);
  }

  setMetodoPagoSelected(metodoSelected: MetodoPagoModel) {
    this.elMetodoPagoSelectedSource.next(metodoSelected);
  }

  setNumberShowPageAtm(num: number) {
    this.numberPageShowAtmSoruce.next(num);
  }

  setShowCuentaMesaNumero(num: number) {
    this.showCuentaMesaNumeroSoruce.next(num);
  }

  setshowLoadListMesas() {
    this.showLoadListMesasSource.next(true);
  }

  setListenGoCarta() {
    this.listenGoBackCartaSource.next(true);
  }

  // setCallListClienteAtencion(num_mesa: string) {
  //   this.callClienteSolicitaAtencionSoruce.next(num_mesa);
  // }

  // setDataFromAtmCash (dataAtm: any) {
  //   this.isDataFromCashAtmSoruce.next(dataAtm);
  // }
}
