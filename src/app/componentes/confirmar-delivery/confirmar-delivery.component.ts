import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogMetodoPagoComponent } from '../dialog-metodo-pago/dialog-metodo-pago.component';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { TipoComprobanteModel } from 'src/app/modelos/tipo.comprobante.model';
// import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DialogVerificarTelefonoComponent } from '../dialog-verificar-telefono/dialog-verificar-telefono.component';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { DialogTipoComprobanteComponent } from '../dialog-tipo-comprobante/dialog-tipo-comprobante.component';
import { PropinaModel } from 'src/app/modelos/propina.model';
import { DialogSelectDireccionComponent } from '../dialog-select-direccion/dialog-select-direccion.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { DialogTiempoEntregaComponent } from '../dialog-tiempo-entrega/dialog-tiempo-entrega.component';


@Component({
  selector: 'app-confirmar-delivery',
  templateUrl: './confirmar-delivery.component.html',
  styleUrls: ['./confirmar-delivery.component.css']
})
export class ConfirmarDeliveryComponent implements OnInit {

  infoEstablecimiento: DeliveryEstablecimiento;
  infoToken: UsuarioTokenModel;
  direccionCliente: DeliveryDireccionCliente;
  direccionClienteIni: DeliveryDireccionCliente;
  metodoPagoSelected: MetodoPagoModel;
  tipoComprobanteSelected: TipoComprobanteModel;
  propinaSelected: PropinaModel;
  tiempoEntregaSelected: TiempoEntregaModel;

  isComercioCerrado = false;
  isComercioAceptaPedidoProgramado = false;
  isRecojoLocalCheked = false;
  isAceptaRecojoLocal = true;
  isValidForm = false;
  isTiempoEntregaValid = false;
  msjErrorDir = ''; //
  rippleColor = 'rgb(255,238,88, 0.3)';

  montoMinimoPedido = 10; // monto minimo del pedido

  // return for printer
  private resData = {
    idcliente: '',
    dni: '',
    nombre: '',
    f_nac: '',
    direccion: '',
    telefono: '',
    paga_con: '',
    dato_adicional: '',
    referencia: '',
    tipoComprobante: {},
    importeTotal: 0,
    metodoPago: {},
    propina: {},
    direccionEnvioSelected: {},
    establecimiento: {},
    subTotales: {},
    pasoRecoger: false,
    costoTotalDelivery: 0,
    tiempoEntregaProgamado: {}
  };

  _listSubtotalesTmp: any;
  _listSubtotales: any;

  isComercioSolidaridad = false;
  titleInputDatoAdicional = 'Dato importante';

  valInputDatoAdicianal = '';

  private isHabilitadoTarjeta = true; // comercios no afiliado no se acepta tarjeta por la comision que cobran, algunos comercios tambien pueden especificar que no desean pagos con tarjeta

  dirEstablecimiento: DeliveryEstablecimiento;

  @Input()
  set listSubtotales(val: any) {
    this._listSubtotales = val;
    this.loadData();
  }


  @Output() isReady = new EventEmitter<boolean>();
  @Output() dataDelivery = new EventEmitter<any>();

  constructor(
    private miPedidoService: MipedidoService,
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private establecimientoService: EstablecimientoService,
    private calcDistanceService: CalcDistanciaService,
    private dialog: MatDialog,
    private dialogTelefono: MatDialog,
    private dialogTipoComprobante: MatDialog,
    private dialogDireccion: MatDialog,
    private dialogTiempoEntrega: MatDialog
    // private crudService: CrudHttpService
  ) { }

  ngOnInit() {


    this.loadData();




    const _datosEstablecieminto = this.establecimientoService.get();
    this.montoMinimoPedido = _datosEstablecieminto.pwa_delivery_importe_min;
    this.tipoComprobanteSelected = this.infoTokenService.infoUsToken.tipoComprobante;
    this.propinaSelected = this.infoTokenService.infoUsToken.propina;

    this.isComercioSolidaridad = _datosEstablecieminto.pwa_delivery_comercio_solidaridad === 1;
    this.titleInputDatoAdicional = this.isComercioSolidaridad ? 'Contacto' : 'Algún dato importante?';




  }

  private getTiempoEntrega() {

    this.tiempoEntregaSelected = new TiempoEntregaModel();
    if ( this.infoTokenService.infoUsToken.tiempoEntrega ) {
      this.tiempoEntregaSelected = this.infoTokenService.infoUsToken.tiempoEntrega;
      this.isTiempoEntregaValid = true;
      return;
    }

    if ( this.isComercioCerrado ) {
      this.tiempoEntregaSelected.descripcion = 'Programa tu entrega';
      this.tiempoEntregaSelected.value = '';
      this.tiempoEntregaSelected.modificado = false;
      this.isTiempoEntregaValid = false;
      return;
    }

    this.tiempoEntregaSelected.descripcion = 'Lo antes posible';
    this.tiempoEntregaSelected.value = this.infoEstablecimiento.tiempo_aprox_entrega;
    this.tiempoEntregaSelected.modificado = false;
    this.isTiempoEntregaValid = true;


  }

  private loadData(): void {
    this.dirEstablecimiento = this.establecimientoService.get();

    this.isComercioCerrado = this.dirEstablecimiento.cerrado === 1;
    this.isComercioAceptaPedidoProgramado = this.dirEstablecimiento.pwa_delivery_habilitar_pedido_programado === 1;


    this.direccionClienteIni = new DeliveryDireccionCliente();
    this.direccionClienteIni.titulo = 'Seleccione una direccion *';
    this.direccionClienteIni.direccion = '';
    this.direccionClienteIni.referencia = '';



    // metodo de pago
    this.isHabilitadoTarjeta  = this.establecimientoService.get().pwa_delivery_acepta_tarjeta === 1;
    this.metodoPagoSelected = this.infoTokenService.setIniMetodoPagoSegunFiltro(this.isHabilitadoTarjeta);

    // direccion de entrega
    this.infoToken = this.infoTokenService.getInfoUs();

    // que tenga la posibilidad de cambiar de direccion
    this.direccionCliente = this.infoToken.direccionEnvioSelected ? this.infoToken.direccionEnvioSelected : this.direccionClienteIni;


    // console.log('info cliente from confirmacion', this.infoToken);

    // establecimiento seleccionado
    this.infoEstablecimiento = this.establecimientoService.get();
    this.getTiempoEntrega();

    this.isAceptaRecojoLocal = this.infoEstablecimiento.pwa_delivery_habilitar_recojo_local === 1;

    // console.log('this.infoEstablecimiento', this.infoEstablecimiento);

    this.resData.telefono = this.infoToken.telefono;
    this.isValidForm = this.infoToken.telefono ? this.infoToken.telefono.length >= 5 ? true : false : false;
    this.isValidForm = !this.metodoPagoSelected.idtipo_pago ? false : this.isValidForm;
    if ( this.isValidForm ) {
      setTimeout(() => {
        this.verificarNum(this.infoToken.telefono);
      }, 500);
    }
  }

  verificarNum(telefono: string): void {
    // this.isValidForm = telefono.trim().length >= 5 ? true : false;
    // this.isValidForm = !this.metodoPagoSelected.idtipo_pago ? false : this.isValidForm;
    // this.isReady.emit(this.isValidForm);
    this.resData.telefono = telefono;
    this.verificarFormValid();

    this.propinaSelected = this.infoTokenService.infoUsToken.propina;

    // const importeTotal = parseInt(this._listSubtotales[0].importe, 0);
    const importeTotal = this._listSubtotales[this._listSubtotales.length - 1].importe;

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.referencia = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.direccionEnvioSelected = this.infoToken.direccionEnvioSelected;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe || '' ;
      this.resData.telefono = telefono;
      this.resData.metodoPago = this.metodoPagoSelected;
      this.resData.tipoComprobante = this.tipoComprobanteSelected;
      this.resData.tiempoEntregaProgamado = this.tiempoEntregaSelected;
      this.resData.establecimiento = this.infoEstablecimiento;
      this.resData.importeTotal = importeTotal;
      this.resData.subTotales = this._listSubtotales;
      this.resData.propina = this.propinaSelected;
      this.infoToken.telefono = telefono;
      this.infoTokenService.setTelefono(telefono);
      this.resData.pasoRecoger = this.isRecojoLocalCheked;
      this.resData.dato_adicional = this.valInputDatoAdicianal;
      this.resData.costoTotalDelivery = this.infoEstablecimiento.costo_total_servicio_delivery;

      // this.infoTokenService.set();

      this.dataDelivery.emit(this.resData);
    }

    this.verificarMontoMinimo();
  }

  private verificarMontoMinimo() {
    // const importeTotal = parseInt(this._listSubtotales[0].importe, 0);
    const importeTotal = this._listSubtotales[this._listSubtotales.length - 1].importe;
    this.resData.importeTotal = importeTotal;
    // this.isValidForm = importeTotal >= this.montoMinimoPedido && this.isValidForm ? true : false;
    // this.isReady.emit(this.isValidForm);

    this.verificarFormValid();

    this.propinaSelected = this.infoTokenService.infoUsToken.propina;

    // if ( !this.direccionCliente.codigo && !this.isRecojoLocalCheked ) { this.isValidForm = false; }

    if (this.isValidForm) {
      this.resData.nombre = this.infoToken.nombres;
      this.resData.direccion = this.infoToken.direccionEnvioSelected.direccion;
      this.resData.referencia = this.infoToken.direccionEnvioSelected.referencia;
      this.resData.direccionEnvioSelected = this.infoToken.direccionEnvioSelected;
      this.resData.idcliente = this.infoToken.idcliente.toString();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe || '';
      this.resData.telefono = this.infoToken.telefono;
      this.resData.metodoPago = this.metodoPagoSelected;
      this.resData.tiempoEntregaProgamado = this.tiempoEntregaSelected;
      this.resData.tipoComprobante = this.tipoComprobanteSelected;
      this.resData.establecimiento = this.infoEstablecimiento;
      this.resData.propina = this.propinaSelected;
      this.resData.importeTotal = importeTotal;
      this.resData.subTotales = this._listSubtotales;
      this.resData.pasoRecoger = this.isRecojoLocalCheked;
      this.resData.dato_adicional = this.valInputDatoAdicianal;
      this.resData.costoTotalDelivery = this.infoEstablecimiento.costo_total_servicio_delivery;
      // this.infoToken.telefono = telefono;
      // this.infoTokenService.setTelefono(telefono);

      this.infoTokenService.set();
      this.dataDelivery.emit(this.resData);
    }
  }

  private verificarFormValid(): void {
    this.isValidForm = this.isTiempoEntregaValid;
    this.isValidForm = this.resData.importeTotal >= this.montoMinimoPedido && this.isValidForm ? true : false;
    this.isValidForm = !this.metodoPagoSelected.idtipo_pago ? false : this.isValidForm;
    this.isValidForm = !this.direccionCliente.codigo && !this.isRecojoLocalCheked ? false : this.isValidForm;
    this.isValidForm = this.resData.telefono.trim().length >= 5 ? this.isValidForm : false;
    // if ( !this.direccionCliente.codigo && !this.isRecojoLocalCheked ) { this.isValidForm = false; }
    this.isReady.emit(this.isValidForm);
  }

  openDialogMetodoPago(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    _dialogConfig.data = {
      importeTotalPagar: this._listSubtotales[this._listSubtotales.length - 1].importe
    };

    const dialogLoading = this.dialog.open(DialogMetodoPagoComponent, _dialogConfig);
      dialogLoading.afterClosed().subscribe((result: MetodoPagoModel) => {
        this.metodoPagoSelected = result;

        this.verificarFormValid();

        // this.isValidForm = !this.metodoPagoSelected.idtipo_pago ? false : this.isValidForm;
        // console.log(result);
        this.verificarMontoMinimo();
      });
  }

  openDialogTipoComprobnate(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    const dialogTpC = this.dialogTipoComprobante.open(DialogTipoComprobanteComponent, _dialogConfig);
    dialogTpC.afterClosed().subscribe((result: TipoComprobanteModel) => {
        this.tipoComprobanteSelected = result;
      });
  }

  openDialogsendSMS() {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    // _dialogConfig.panelClass = 'my-full-screen-dialog';
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.data = {
      idcliente: this.infoTokenService.infoUsToken.idcliente,
      numberphone: this.infoTokenService.infoUsToken.telefono ? this.infoTokenService.infoUsToken.telefono : '' // '+51934746830'
    };

    const dialogRefTelefono = this.dialogTelefono.open(DialogVerificarTelefonoComponent, _dialogConfig);

    dialogRefTelefono.afterClosed().subscribe((result: any) => {
      this.isValidForm = result.verificado;
      if ( result.verificado ) {
        this.infoToken.telefono = result.numberphone;
        this.infoTokenService.setTelefono(result.numberphone);
        this.verifyClientService.setTelefono(result.numberphone);
        this.resData.telefono = this.infoToken.telefono;
      }
      this.verificarMontoMinimo();
      // console.log(result);
    });

  }

  // cuando el recojo es en el local
  recalcularTotales(): void {
    if ( this.isRecojoLocalCheked ) {
      // propina se vielve 0
      this.propinaSelected = {'idpropina': 1, 'value': 0 , 'descripcion': 'S/. 0', 'checked': true};
      this.infoTokenService.setPropina(this.propinaSelected);

      // recalcular subtotales
      // lista temporal para back
      this._listSubtotalesTmp = JSON.parse(JSON.stringify(this._listSubtotales));

      const rowTotal = this._listSubtotales[this._listSubtotales.length - 1];
      this._listSubtotales = this._listSubtotales.filter(x => {
        const _idTp = isNaN(parseInt(x.id, 0)) ? 1 : x.id;
        if ( _idTp >= 0  && x.descripcion !== 'TOTAL' && x.descripcion.toUpperCase() !== 'ENTREGA' ) {
          return x;
        }
      });
      const _subtotal = this._listSubtotales.map((x: any) => parseFloat(x.importe)).reduce((a, b) => a + b, 0);
      rowTotal.importe = _subtotal;
      this._listSubtotales.push(rowTotal);

    } else {
      this._listSubtotales = this._listSubtotalesTmp;
    }

    console.log('this._listSubtotales', this._listSubtotales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._listSubtotales)));
    this.infoTokenService.setPasoRecoger(this.isRecojoLocalCheked);

    this.verificarMontoMinimo();
  }

  selectedPropinaRepartidor(propina: PropinaModel) {
    // console.log('propina', propina);
    this.propinaSelected = propina;
    this.resData.propina = propina;
  }









  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();
    // this.resData.idcliente =  this.resData.idcliente !== '' ? this.resData.idcliente : this.clienteSelectBusqueda ? this.clienteSelectBusqueda.idcliente : '';
    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
      data: {
        isGuardar: false, // no guarda sole devuelve los datos de la direccion
        isFromComercio: true, // para empezar en la posicion del comercio
        idClienteBuscar: this.resData.idcliente
      }
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.msjErrorDir = '';
        this.direccionCliente = <DeliveryDireccionCliente>data;

        if ( this.direccionCliente.codigo !== this.infoEstablecimiento.codigo_postal ) {
          // el servicio no esta disponible en esta ubicacion
          // this.direccionCliente = this.direccionClienteIni;
          // this.infoToken.direccionEnvioSelected = null;
          this.direccionCliente.codigo = null;
          this.msjErrorDir = 'Servicio no disponible en esta dirección.';
          this.verificarMontoMinimo();
          return;
        }

        this.infoToken.direccionEnvioSelected = this.direccionCliente;

        // esto para poder guardar en el procedure
        this.direccionCliente.idcliente_pwa_direccion = this.direccionCliente.idcliente_pwa_direccion === null ? 0 : this.direccionCliente.idcliente_pwa_direccion;


        this.calcDistanceService.calculateRoute(<DeliveryDireccionCliente>data, this.dirEstablecimiento);


        // recalcular
        setTimeout(() => {
          // console.log('this.dirEstablecimiento', this.dirEstablecimiento);

          this.establecimientoService.set(this.dirEstablecimiento);
          this.infoEstablecimiento.c_servicio = this.dirEstablecimiento.c_servicio;
          this.resData.costoTotalDelivery = this.dirEstablecimiento.c_servicio; // this.infoEstablecimiento.costo_total_servicio_delivery;

          const _arrSubtotales = this.miPedidoService.getArrSubTotales(this.dirEstablecimiento.rulesSubTotales);
          localStorage.setItem('sys::st', btoa(JSON.stringify(_arrSubtotales)));

          this._listSubtotales = _arrSubtotales;

          // console.log('_arrSubtotales', _arrSubtotales);
          this.verificarMontoMinimo();
        }, 600);

      }
    );
  }


  openDialogTiempoEntrega(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = false;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    const dialogTpC = this.dialogTipoComprobante.open(DialogTiempoEntregaComponent, _dialogConfig);
    dialogTpC.afterClosed().subscribe((result: TiempoEntregaModel) => {
        console.log('TiempoEntregaModel ==== ', result);
        if ( result ) {
          this.infoTokenService.setTiempoEntrega(result);
          this.tiempoEntregaSelected = result;
          this.isTiempoEntregaValid = true;
          this.verificarMontoMinimo();
        }
      });
  }

}

