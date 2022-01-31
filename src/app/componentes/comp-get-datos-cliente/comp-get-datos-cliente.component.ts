import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { GetFormDatosCliente } from 'src/app/modelos/GetFormDatosCliente';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { DialogSelectDireccionComponent } from '../dialog-select-direccion/dialog-select-direccion.component';
import { DialogTiempoEntregaComponent } from '../dialog-tiempo-entrega/dialog-tiempo-entrega.component';
import { DialogMetodoPagoComponent } from '../dialog-metodo-pago/dialog-metodo-pago.component';
import { DialogVerificarTelefonoComponent } from '../dialog-verificar-telefono/dialog-verificar-telefono.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';


@Component({
  selector: 'app-comp-get-datos-cliente',
  templateUrl: './comp-get-datos-cliente.component.html',
  styleUrls: ['./comp-get-datos-cliente.component.css']
})
export class CompGetDatosClienteComponent implements OnInit {

  @Input() opciones: GetFormDatosCliente;
  @Output() frmResponse = new EventEmitter<any>();


  direccionA: DeliveryDireccionCliente;
  direccionB: DeliveryDireccionCliente;
  direccionClienteIni: DeliveryDireccionCliente;
  infoToken: UsuarioTokenModel;
  metodoPagoSelected: MetodoPagoModel;
  tiempoEntregaSelected: TiempoEntregaModel;
  laPlazaDelivery: DeliveryEstablecimiento;
  lasCiudad = '';

  isTiempoEntregaValid = true;

  msjErrorDir = '';
  systemOS = '';
  datosFormUno: any;

  isFormValid = false;
  isFormValidDos = false;
  isCalculandoDistancia = false;

  titleDirA = 'De dónde lo recogemos?';
  titleDirB = 'A dónde lo llevamos?';

  constructor(
    private infoTokenService: InfoTockenService,
    private dialogDireccion: MatDialog,
    private dialogTelefono: MatDialog,
    private dialogTiempoEntrega: MatDialog,
    private dialog: MatDialog,
    private utilService: UtilitariosService,
    private calcDistanceService: CalcDistanciaService,
    private crudService: CrudHttpService,
    private plazaDelivery: SedeDeliveryService,
  ) { }

  ngOnInit(): void {
    this.systemOS = this.utilService.getOS();
    this.msjErrorDir = '';

    this.infoToken = this.infoTokenService.getInfoUs();

    this.direccionClienteIni = new DeliveryDireccionCliente();
    this.direccionClienteIni.titulo = 'Seleccione una direccion *';
    this.direccionClienteIni.direccion = '';
    this.direccionClienteIni.referencia = '';

    this.datosFormUno = {};
    this.datosFormUno.descripcion_paquete = '';
    this.datosFormUno.telefono = this.infoToken.telefono;

    this.direccionA = this.direccionClienteIni;
    this.direccionB = this.direccionClienteIni;

    this.tiempoEntregaSelected = new TiempoEntregaModel();
    this.tiempoEntregaSelected.descripcion = 'Programa tu entrega';
    this.tiempoEntregaSelected.value = '';
    this.tiempoEntregaSelected.modificado = false;
    this.tiempoEntregaSelected.valid = false;
    this.isTiempoEntregaValid = false;

    this.titleDirA = this.opciones.tituloDirA;
    this.titleDirB = this.opciones.tituloDirB;

    if (this.opciones.metodoPago) {
      this.metodoPagoSelected = this.infoTokenService.setIniMetodoPagoSegunFiltro(this.opciones.metodoPagoAceptaTarjeta);
    }

  }

  openDialogDireccion(op: number) {
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
        if ( op === 0 ) { // dedonde
          this.direccionA = <DeliveryDireccionCliente>data;
        } else { // adonde
          this.direccionB = <DeliveryDireccionCliente>data;
        }
        // this.getDatosSede();
        this.getDatosCiudadSeleted();
        this.validFormDos();
      }
    );
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

  private validFormDos() {
    this.isFormValidDos = this.isFormValid;
    this.isFormValidDos = this.opciones.showDirreccionA ? !this.direccionA.ciudad ? false : true : this.isFormValidDos;
    this.isFormValidDos = this.opciones.showDirreccionB ? !this.direccionB.ciudad ? false : this.isFormValidDos : true;
    this.isFormValidDos = this.opciones.metodoPago ? !this.metodoPagoSelected.idtipo_pago ? false : this.isFormValidDos : true;
    this.isFormValidDos = this.opciones.telefono ? this.datosFormUno.telefono.trim().length >= 5 ? this.isFormValidDos : false : true;

    const res = {
      success: this.isFormValidDos,
      direccionA: this.direccionA,
      direccionB: this.direccionB,
      metodoPago: this.metodoPagoSelected,
      telefono: this.datosFormUno.telefono,
      ladingCostoServicio: this.isCalculandoDistancia,
      costosPlaza: this.laPlazaDelivery,
      cliente: this.infoToken,
      systemOS: this.systemOS
    };

    this.frmResponse.emit(res);

  }

  getDatosCiudadSeleted() {
    this.isCalculandoDistancia = true;
    this.isFormValid = false;

    if ( this.lasCiudad !== '' && this.lasCiudad === this.direccionA.ciudad ) {
      this.calcularDistanciaEntregaComp();
      return;
    }

    this.plazaDelivery.loadDatosPlazaByCiudad(this.direccionA.ciudad)
    .subscribe((res: any) => {
      this.laPlazaDelivery = res;
      this.lasCiudad = this.laPlazaDelivery.ciudad;
      this.laPlazaDelivery.latitude = this.laPlazaDelivery.centro.lat;
      this.laPlazaDelivery.longitude = this.laPlazaDelivery.centro.lon;

      this.calcularDistanciaEntregaComp();
    });
  }

  calcularDistanciaEntregaComp() {

    let paseCalcular = false;
    paseCalcular = this.opciones.calDistanciaAB ? true : false;
    paseCalcular = this.opciones.calDistanciaCentro ? true : paseCalcular;
    paseCalcular = this.opciones.calDistanciaFrom ? true : paseCalcular;

    if ( !paseCalcular ) { this.isCalculandoDistancia = false; this.isFormValid = true; this.validFormDos(); return; }

    const ciudadA = this.direccionA.ciudad;
    let ciudadB = this.direccionB.ciudad;

    if (this.opciones.calDistanciaCentro) {
      this.direccionB.latitude = this.laPlazaDelivery.latitude;
      this.direccionB.longitude = this.laPlazaDelivery.longitude;
      ciudadB = this.laPlazaDelivery.ciudad;
    }

    if ( !ciudadA || !ciudadB ) { this.isCalculandoDistancia = false; this.isFormValid = false; this.validFormDos(); return; }

    if ( ciudadA.toLocaleLowerCase() !== ciudadB.toLocaleLowerCase() ) {
      // el servicio no esta disponible en esta ubicacion
      this.direccionA.codigo = null;
      this.msjErrorDir = 'Servicio no disponible en esta dirección.';

      this.isCalculandoDistancia = false; this.isFormValid = false;
      this.validFormDos();
      return;
    }

    const _dirB = this.laPlazaDelivery;
    // pasamos las coordenadas de la direccion b
    _dirB.latitude = this.direccionB.latitude;
    _dirB.longitude = this.direccionB.longitude;
    this.isCalculandoDistancia = true;

    this.calcDistanceService.calculateRoute(this.direccionA, _dirB, false);
    // .subscribe((res: any) => {
      setTimeout(() => {
        this.laPlazaDelivery = _dirB;
        this.isCalculandoDistancia = false;
        // this.calcCostoServicio();
        // console.log('this.laPlazaDelivery', this.laPlazaDelivery);
        this.isCalculandoDistancia = false; this.isFormValid = true;
        this.validFormDos();
      }, 1600);

    // });
  }

}
