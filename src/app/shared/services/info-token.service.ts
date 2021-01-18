import { Injectable } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { TipoComprobanteModel } from 'src/app/modelos/tipo.comprobante.model';
import { PropinaModel } from 'src/app/modelos/propina.model';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { Router } from '@angular/router';



@Injectable({
  providedIn: 'root'
})
export class InfoTockenService {
  infoUsToken: UsuarioTokenModel;
  constructor(
    // private miPedidoService: MipedidoService,
    private router: Router
  ) {
    this.converToJSON();
  }

  getInfoUs(): UsuarioTokenModel {
    this.verificarContunuarSession();
    this.getLocalIpCliente();
    return this.infoUsToken;
  }

  saveToken(token: any) {
    localStorage.setItem('::token', token);

    // guardo tambien la hora que esta iniciando session
    const ms_tieme_init_session = new Date().getTime();
    localStorage.setItem('sys::numtis', ms_tieme_init_session.toString());
  }

  getInfoSedeToken(): string {
    // const token = jwt.decode(this.getToken());
    this.verificarContunuarSession();
    return this.infoUsToken.idsede.toString();
    // return '1';
  }
  getInfoOrgToken(): string {
    this.verificarContunuarSession();
    return this.infoUsToken.idorg.toString();
  }

  getInfoNomSede(): string {
    this.verificarContunuarSession();
    return localStorage.getItem('sys::s');
  }

  isCliente(): boolean {
    this.verificarContunuarSession();
    return this.infoUsToken.isCliente;
  }

  isSoloLlevar(): boolean {
    this.verificarContunuarSession();
    return this.infoUsToken.isSoloLLevar;
  }

  isDelivery(): boolean {
    this.verificarContunuarSession();
    return this.infoUsToken.isDelivery;
  }

  getLocalIpCliente(): string {
    this.verificarContunuarSession();
    if ( this.infoUsToken ) {
      this.infoUsToken.ipCliente = localStorage.getItem('sys::it') || '';
      return this.infoUsToken.ipCliente;
    }
  }

  setLocalIpCliente(val: string): void {
    localStorage.setItem('sys::it', val);
  }

  setIsPagoSuccess(val: boolean) {
    this.infoUsToken.isPagoSuccess = val;
    this.set();
  }

  setSocketId( val: string) {
    // this.infoUsToken.socketId = this.infoUsToken.socketId ? this.infoUsToken.socketId : val;
    if ( this.infoUsToken ) {
      this.infoUsToken.socketId = val;
      this.set();
    }
  }

  // para el confirmar pago si es clienteDelivery
  setOrderDelivery(_order: string, _importes: string): void {
    this.infoUsToken.orderDelivery = btoa(_order);
    this.infoUsToken.importeDelivery = btoa(_importes);

    // const _token = `eyCJ9.${btoa(JSON.stringify(this.infoUsToken))}`;
    // localStorage.setItem('::token', _token);
    this.set();
  }

  setTelefono(val: string) {
    this.infoUsToken.telefono = val;
    this.set();
  }

  setMetodoPago( metodo: MetodoPagoModel) {
    this.infoUsToken.metodoPago = metodo;
    this.set();
  }

  setTipoComprobante( comprobante: TipoComprobanteModel) {
    this.infoUsToken.tipoComprobante = comprobante;
    this.set();
  }

  setPropina( propina: PropinaModel) {
    this.infoUsToken.propina = propina;
    this.set();
  }

  setPasoRecoger( val: boolean) {
    this.infoUsToken.pasoRecoger = val;
    this.set();
  }

  setTiempoEntrega( val: TiempoEntregaModel) {
    this.infoUsToken.tiempoEntrega = val;
    this.set();
  }

  setIniMetodoPago(descripcion = 'Tarjeta') {
    const metodoPagoInit: MetodoPagoModel = new MetodoPagoModel;
    metodoPagoInit.idtipo_pago = descripcion === 'Tarjeta' ? 2 : 1;
    metodoPagoInit.descripcion = descripcion;
    metodoPagoInit.importe = '0';
    metodoPagoInit.checked = true;

    this.setMetodoPago( metodoPagoInit );
  }

  setIniMetodoPagoSegunFiltro(isAceptaTarjeta): MetodoPagoModel {
    const metodoPagoInit: MetodoPagoModel = new MetodoPagoModel;

    if ( isAceptaTarjeta ) {
      metodoPagoInit.idtipo_pago = 2;
      metodoPagoInit.descripcion = 'Tarjeta';
      metodoPagoInit.importe = '0';
      metodoPagoInit.checked = true;
    }

    this.setMetodoPago( metodoPagoInit );
    return metodoPagoInit;

    // if ( isAceptaYape ) {
    //   metodoPagoInit.idtipo_pago = 3;
    //   metodoPagoInit.descripcion = 'Yape';
    //   metodoPagoInit.importe = '0';
    //   metodoPagoInit.checked = true;
    //   this.setMetodoPago( metodoPagoInit );
    //   return metodoPagoInit;
    // }

    // metodoPagoInit.idtipo_pago = 1;
    // metodoPagoInit.descripcion = 'Efectivo';
    // metodoPagoInit.importe = '0';
    // metodoPagoInit.checked = true;
    // this.setMetodoPago( metodoPagoInit );
    // return metodoPagoInit;

    // this.setMetodoPago( metodoPagoInit );
    // return metodoPagoInit;

  }

  setMetodoPagoSelected(metodo: MetodoPagoModel) {
    this.infoUsToken.metodoPagoSelected = metodo;
    this.set();
  }

  setIniTipoComprobante() {
    const tipoComprobanteInit: TipoComprobanteModel = new TipoComprobanteModel;
    tipoComprobanteInit.idtipo_comprobante = 1;
    tipoComprobanteInit.descripcion = 'Boleta';
    tipoComprobanteInit.checked = true;

    this.setTipoComprobante( tipoComprobanteInit );
  }

  setIniPropina() {
    const prpinaInt: PropinaModel = new PropinaModel;
    prpinaInt.idpropina = 1;
    prpinaInt.value = 0;
    prpinaInt.descripcion = 'S/. 0';
    prpinaInt.checked = true;

    this.setPropina( prpinaInt );
  }

  setIniTiempoEntrega() {
    const tiempoEntregaSelected = new TiempoEntregaModel();
    tiempoEntregaSelected.descripcion = 'Programa la entrega';
    tiempoEntregaSelected.value = '';
    tiempoEntregaSelected.modificado = false;

    this.setTiempoEntrega(tiempoEntregaSelected);
  }

  setOtro( val: any) {
    this.infoUsToken.otro = val;
    this.set();
  }

  // guarda en el local storage
  set() {
    const _token = `eyCJ9.${btoa(JSON.stringify(this.infoUsToken))}`;
    localStorage.setItem('::token', _token);
  }
  //

  getToken(): any { return localStorage.getItem('::token'); }
  getTokenAuth(): any { return localStorage.getItem('::token:auth'); }

  converToJSON(): void {
    if (localStorage.getItem('::token')) {
      const _token =  JSON.parse(atob(localStorage.getItem('::token').split('.')[1]));

      // si existe idcliente, setea al usuario
      if ( _token.idcliente ) {
        const _newUs = new UsuarioTokenModel();
        _newUs.isCliente = true;
        _newUs.idcliente = _token.idcliente;
        _newUs.idorg = _token.idorg;
        _newUs.idsede = _token.idsede;
        _newUs.nombres = _token.datalogin ? _token.datalogin.name : _token.nombres ;
        _newUs.idusuario = 0;
        _newUs.usuario = 'cliente';
        _newUs.numMesaLector = _token.numMesaLector;
        _newUs.ipCliente = _token.ipCliente;
        _newUs.isSoloLLevar = _token.isSoloLLevar;
        _newUs.isDelivery = _token.isDelivery;
        _newUs.direccionEnvioSelected = _token.direccionEnvioSelected;
        _newUs.tiempoEntrega = _token.tiempoEntrega;
        _newUs.telefono = _token.telefono;
        _newUs.orderDelivery = _token.orderDelivery;
        _newUs.importeDelivery = _token.importeDelivery;
        _newUs.isPagoSuccess = _token.isPagoSuccess;
        _newUs.metodoPago = _token.metodoPago;
        _newUs.tipoComprobante = _token.tipoComprobante;
        _newUs.propina = _token.propina;
        _newUs.socketId = _token.socketId;
        _newUs.otro = _token.otro;
        _newUs.pasoRecoger = _token.pasoRecoger;
        this.infoUsToken = _newUs;

        // agregar el metodo pago prederteminado tarjeta // valores iniciales
        if (!this.infoUsToken.metodoPago)  { this.setIniMetodoPago(); this.setIniTipoComprobante(); this.setIniPropina(); this.setPasoRecoger(false);  } // this.setIniTiempoEntrega();
      } else {

        this.infoUsToken = typeof _token.usuario === 'object' ? <UsuarioTokenModel>_token.usuario : <UsuarioTokenModel>_token;
        // this.infoUsToken = <UsuarioTokenModel>_token;

        // inicializa valores
        this.setIniMetodoPago(); this.setIniTipoComprobante(); this.setIniPropina(); this.setPasoRecoger(false); // this.setIniTiempoEntrega();

        this.infoUsToken.isCliente = false;
      }
    } else {
      this.infoUsToken = null;
    }
  }

  cerrarSession(): void {
    try {
      if (!this.infoUsToken.isDelivery) {
        localStorage.removeItem('::token');
        localStorage.removeItem('token');
        localStorage.removeItem('sys::numtis');
      }
    } catch (error) {
      console.log(error);
    }

    // borra datos del storage del pedido
    this.removeStoragePedido();

    // al momento de confirmar pedido envia a cerrar session, solo debe borrar los datos del pedido
    // localStorage.removeItem('sys::rules');
    // localStorage.removeItem('sys::status');
    // localStorage.removeItem('sys::st');

    // localStorage.removeItem('sys::ed');
    // localStorage.removeItem('sys::transaction-response');
    // localStorage.removeItem('sys::transaction-load');
    // localStorage.removeItem('data');
    // localStorage.removeItem('sys::tpm');
  }

  // borra datos del storage del pedido
  removeStoragePedido() {
    localStorage.removeItem('sys::rules');
    localStorage.removeItem('sys::status');
    localStorage.removeItem('sys::st');

    localStorage.removeItem('sys::ed');
    localStorage.removeItem('sys::transaction-response');
    localStorage.removeItem('sys::transaction-load');
    localStorage.removeItem('data');
  }

  // cerrar toda la sesssion
  cerrarSessionGoIni() {
    // this.cerrarSession();
    localStorage.clear();
    this.router.navigate(['../']);
  }

  // verifica el tiempo de inactividad para cerrar session
  // cerrar session despues de 3:20 => ( 12000 sec )horas inciadas
  verificarContunuarSession(): boolean {

    // si no existe token cierra
    if ( !this.infoUsToken) {

      // trata de recuperar el token desde tpm
      const isUsTmp = localStorage.getItem('sys::tpm');
      if ( isUsTmp ) {
        localStorage.setItem('::token', 'eyCJ9.' + isUsTmp);
        this.converToJSON();
        return;
      }

      this.cerrarSessionGoIni();
    }
    if ( !this.infoUsToken || !this.infoUsToken.isCliente || !this.infoUsToken.isDelivery) { // si es usuario autorizado no cuenta tiempo
      return true;
    }

    if (this.infoUsToken.isDelivery) {
      // si es delivery no cierra session
      return true;
    }

    let numTis = parseInt(localStorage.getItem('sys::numtis'), 0);
    let continueSession = this.infoUsToken.isDelivery ? this.infoUsToken.isDelivery : !isNaN(numTis);

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    if ( isNaN(numTis) ) {
      localStorage.setItem('sys::numtis', new Date().getTime().toString());
    }

    numTis = isNaN(numTis) ?  new Date().getTime() : numTis;
    const ms_now = new Date().getTime();
    const ms = ms_now - numTis;
    const sec = Math.floor((ms / 1000));

    if ( sec > 10000 ) {
      continueSession = false;
    }

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    return true;
    // const timeAfter = localStorage.getItem('sys::tnum') ? parseInt(localStorage.getItem('sys::tnum'), 0) : ms_new;
  }
}
