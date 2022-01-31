import { Component, OnInit } from '@angular/core';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogSelectDireccionComponent } from '../dialog-select-direccion/dialog-select-direccion.component';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { DialogMetodoPagoComponent } from '../dialog-metodo-pago/dialog-metodo-pago.component';
import { DialogVerificarTelefonoComponent } from '../dialog-verificar-telefono/dialog-verificar-telefono.component';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { Router } from '@angular/router';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { DialogTiempoEntregaComponent } from '../dialog-tiempo-entrega/dialog-tiempo-entrega.component';

@Component({
  selector: 'app-comp-pide-lo-que-quieras',
  templateUrl: './comp-pide-lo-que-quieras.component.html',
  styleUrls: ['./comp-pide-lo-que-quieras.component.css']
})
export class CompPideLoQueQuierasComponent implements OnInit  {

  direccionCliente: DeliveryDireccionCliente;
  direccionClienteIni: DeliveryDireccionCliente;
  infoToken: UsuarioTokenModel;
  metodoPagoSelected: MetodoPagoModel;
  laPlazaDelivery: DeliveryEstablecimiento;
  lasCiudad = '';
  importe_pagar = 4;
  isLoading = false;
  isEnviado = false;
  isExpress = false; // entrega
  isCalculandoDistanciaA = false;
  isShowFinalize = false;
  systemOS = '';

  msjErrorDir = '';

  datosFormUno: any;

  isFormValid = false;
  isFormValidDos = false;

  tiempoEntregaSelected: TiempoEntregaModel;
  isTiempoEntregaValid = true;

  constructor(
    private infoTokenService: InfoTockenService,
    private plazaDelivery: SedeDeliveryService,
    private calcDistanceService: CalcDistanciaService,
    private crudService: CrudHttpService,
    private dialogDireccion: MatDialog,
    private dialogTelefono: MatDialog,
    private dialogTiempoEntrega: MatDialog,
    private dialog: MatDialog,
    private router: Router,
    private utilService: UtilitariosService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit(): void {
    this.systemOS = this.utilService.getOS();

    this.msjErrorDir = '';
    this.infoToken = this.infoTokenService.getInfoUs();

    this.direccionClienteIni = new DeliveryDireccionCliente();
    this.direccionClienteIni.titulo = 'Seleccione una direccion *';
    this.direccionClienteIni.direccion = '';
    this.direccionClienteIni.referencia = '';

    this.tiempoEntregaSelected = new TiempoEntregaModel();
    this.tiempoEntregaSelected.descripcion = 'Programa tu entrega';
    this.tiempoEntregaSelected.value = '';
    this.tiempoEntregaSelected.modificado = false;
    this.tiempoEntregaSelected.valid = false;
    this.isTiempoEntregaValid = false;

    this.metodoPagoSelected = this.infoTokenService.setIniMetodoPagoSegunFiltro(false);

    this.datosFormUno = {};
    this.datosFormUno.que_compramos = '';
    this.datosFormUno.telefono = this.infoToken.telefono;


    this.direccionCliente = this.infoToken.direccionEnvioSelected ? this.infoToken.direccionEnvioSelected : this.direccionClienteIni;
    this.scrollTopInit();


    this.getDatosSede();
  }

  private getTiempoEntrega() {


    const horanow = new Date().getHours();

    if ( this.laPlazaDelivery.options.s_hfin ) {
      const hFin = this.laPlazaDelivery.options.s_hfin.split(':')[0];
      this.isTiempoEntregaValid = horanow <= parseInt(hFin, 0);
    }

    if ( this.tiempoEntregaSelected.modificado ) { this.isTiempoEntregaValid = true; return; }
    if ( !this.isTiempoEntregaValid ) {
      this.tiempoEntregaSelected.descripcion = 'Programa la entrega';
      this.tiempoEntregaSelected.value = '';
      this.tiempoEntregaSelected.modificado = false;
      this.tiempoEntregaSelected.valid = true;
      // this.isTiempoEntregaValid = false;
    } else {
      this.tiempoEntregaSelected.descripcion = 'Lo antes posible';
      this.tiempoEntregaSelected.value = '10 a 15 Minutos';
      this.tiempoEntregaSelected.modificado = false;
      this.tiempoEntregaSelected.valid = true;
      // this.isTiempoEntregaValid = true;
    }



  }

  // obtener los datos de la sede segun direccion de entrega
  // toma como referencia el centro de la ciudad para calcular la distancia
  getDatosSede() {
    if ( !this.direccionCliente.ciudad ) { return; }
    if ( this.direccionCliente.ciudad === this.lasCiudad ) {
      this.getTiempoEntrega();
      this.calcularDistanciaEntrega();
      this.setDiasHoraEstablecimineto();
      return; }


    this.plazaDelivery.loadDatosPlazaByCiudad(this.direccionCliente.ciudad)
    .subscribe((res: any) => {
      this.laPlazaDelivery = res;
      this.lasCiudad = this.laPlazaDelivery.ciudad;
      this.laPlazaDelivery.latitude = this.laPlazaDelivery.centro.lat;
      this.laPlazaDelivery.longitude = this.laPlazaDelivery.centro.lon;
      this.calcularDistanciaEntrega();
      this.setDiasHoraEstablecimineto();
      this.getTiempoEntrega();
    });
  }

  vehiculoSelected(val: any) {
    this.datosFormUno.vehiculo = val;
    this.validFormUno();
    this.calcCostoServicio();
  }

  costoSelected(val: any) {
    this.datosFormUno.costo_producto = val;
    this.validFormUno();
  }

  textChanged(val: any) {
    this.datosFormUno.que_compramos = val;
    this.validFormUno();
  }

  private validFormUno() {
    this.isFormValid = this.datosFormUno.vehiculo && this.datosFormUno.costo_producto && this.datosFormUno.que_compramos !== '';
    // this.isFormValid = !this.metodoPagoSelected.idtipo_pago ? false : this.isFormValid;
    // this.isFormValid = !this.direccionCliente.codigo ? false : this.isFormValid;
    // this.isFormValid = this.datosFormUno.telefono.trim().length >= 5 ? this.isFormValid : false;
  }

  private validFormDos() {
    this.isFormValidDos = this.isFormValid;
    this.isFormValidDos = !this.metodoPagoSelected.idtipo_pago ? false : this.isFormValidDos;
    this.isFormValidDos = !this.direccionCliente.ciudad ? false : this.isFormValidDos;
    this.isFormValidDos = this.datosFormUno.telefono.trim().length >= 5 ? this.isFormValidDos : false;
    this.isFormValidDos = this.isFormValidDos && !this.isCalculandoDistanciaA;
  }


  openDialogMetodoPago(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    _dialogConfig.data = {
      importeTotalPagar: 3
    };

    const dialogLoading = this.dialog.open(DialogMetodoPagoComponent, _dialogConfig);
      dialogLoading.afterClosed().subscribe((result: MetodoPagoModel) => {
        this.metodoPagoSelected = result;
        this.validFormDos();
      });
  }

  openDialogTiempoEntrega(): void {
    const _dialogConfig = new MatDialogConfig();
    // _dialogConfig.width = '480px';
    // _dialogConfig.disableClose = false;
    // _dialogConfig.hasBackdrop = true;
    // _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.panelClass =  ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    const dialogTpC = this.dialogTiempoEntrega.open(DialogTiempoEntregaComponent, _dialogConfig);
    dialogTpC.afterClosed().subscribe((result: TiempoEntregaModel) => {

        if ( result ) {
          this.infoTokenService.setTiempoEntrega(result);
          this.tiempoEntregaSelected = result;
          this.isTiempoEntregaValid = true;
          // this.verificarMontoMinimo();
        }
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
      if ( result.verificado ) {
        this.infoToken.telefono = result.numberphone;
        this.infoTokenService.setTelefono(result.numberphone);
        this.datosFormUno.telefono = this.infoToken.telefono;
        this.validFormDos();
        // this.verifyClientService.setTelefono(result.numberphone);
      }
    });

  }

  openDialogDireccion() {
    const _DdialogConfig = new MatDialogConfig();
    _DdialogConfig.disableClose = true;
    _DdialogConfig.hasBackdrop = true;
    _DdialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    _DdialogConfig.data = {
      isGuardar: this.infoTokenService.infoUsToken.idcliente ? true : false, // no guarda sole devuelve los datos de la direccion
      isFromComercio: true, // para empezar en la posicion del comercio
      // idClienteBuscar: this.infoTokenService.infoUsToken.idcliente // this.resData.idcliente
    };
    // this.resData.idcliente =  this.resData.idcliente !== '' ? this.resData.idcliente : this.clienteSelectBusqueda ? this.clienteSelectBusqueda.idcliente : '';
    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, _DdialogConfig);

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }

        this.msjErrorDir = '';
        this.direccionCliente = <DeliveryDireccionCliente>data;
        this.getDatosSede();
        this.validFormDos();
      }
    );
  }

  calcularDistanciaEntrega() {
    this.isCalculandoDistanciaA = true;
    if ( this.direccionCliente.ciudad.toLocaleLowerCase() !== this.laPlazaDelivery.ciudad.toLocaleLowerCase() ) {
      // el servicio no esta disponible en esta ubicacion
      this.direccionCliente.codigo = null;
      this.msjErrorDir = 'Servicio no disponible en esta dirección.';
      return;
    }


    this.calcDistanceService.calculateRoute(this.direccionCliente, this.laPlazaDelivery, false);
    // .subscribe((res: DeliveryEstablecimiento) => {
      setTimeout(() => {
        this.isCalculandoDistanciaA = false;
        this.laPlazaDelivery = this.laPlazaDelivery;
        // this.laPlazaDelivery = res;
        // _suscription.unsubscribe();
        this.validFormDos();
        this.calcCostoServicio();
      }, 1600);
    // });


  }

  calcCostoServicio() {
    if ( !this.laPlazaDelivery ) {return; }
    const costo_distancia = this.laPlazaDelivery.c_servicio - this.laPlazaDelivery.c_minimo;
    this.importe_pagar = this.laPlazaDelivery.options.costo_mandado + costo_distancia + this.datosFormUno.vehiculo.costo_adicional;
  }


  enviarPedidoLoQ() {

    try {
      this.isLoading = true;
      this.isEnviado = false;
      this.datosFormUno.importe_pagar = this.importe_pagar;
      this.datosFormUno.idcliente = this.infoToken.idcliente;
      this.datosFormUno.direccionCliente = this.direccionCliente;
      this.datosFormUno.metodoPago = this.metodoPagoSelected;
      this.datosFormUno.ciudad = this.laPlazaDelivery.ciudad;
      this.datosFormUno.tiempoEntrega = this.tiempoEntregaSelected;
      this.datosFormUno.distancia_km = this.laPlazaDelivery.distancia_km;
      this.datosFormUno.distancia_mt = this.laPlazaDelivery.distancia_mt;
      this.datosFormUno.systemOS = this.systemOS;
      this.datosFormUno.is_express = 0;

    } catch (error) {
      console.log(error);
    }

    const _dataSend = {
      dataInfo: this.datosFormUno
    };

    this.crudService.postFree(_dataSend, 'delivery', 'set-pedido-mandado', false)
    .subscribe(res => {

      setTimeout(() => {
        this.isLoading = false;
        this.isEnviado = true;
      }, 1500);
    });

  }

  goZona() {
    this.router.navigate(['./zona-delivery/establecimientos']);
  }

  goNext() {
    this.isShowFinalize = !this.isShowFinalize;
    this.scrollTopInit();
  }

  private scrollTopInit() {
    try {
      const divcontent = document.getElementById('contentmaster');
      divcontent.scrollTop = 0;
    } catch (error) {}
  }

  // para el tiempo programado
  setDiasHoraEstablecimineto() {
    this.laPlazaDelivery.hora_ini = this.laPlazaDelivery.options.s_hini;
    this.laPlazaDelivery.hora_fin = this.laPlazaDelivery.options.s_hfin;
    this.laPlazaDelivery.dias_atienden = this.laPlazaDelivery.options.s_dias;
    this.laPlazaDelivery.pwa_delivery_habilitar_pedido_programado = 1;
    this.laPlazaDelivery.tiempo_aprox_entrega = this.laPlazaDelivery.options.s_tiempo_aprox;
    this.establecimientoService.set(this.laPlazaDelivery);
  }




}
