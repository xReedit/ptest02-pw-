import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogSelectDireccionComponent } from '../dialog-select-direccion/dialog-select-direccion.component';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { DialogMetodoPagoComponent } from '../dialog-metodo-pago/dialog-metodo-pago.component';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
// import { MapsAPILoader } from '@agm/core';

@Component({
  selector: 'app-datos-delivery',
  templateUrl: './datos-delivery.component.html',
  styleUrls: ['./datos-delivery.component.css']
})
export class DatosDeliveryComponent implements OnInit {
  @ViewChild('search', {static: false}) public searchElementRef: ElementRef;

  @Output() public changeStatus = new EventEmitter<any>();

  _listSubtotalesTmp: any;
  _listSubtotales: any;

  private isValid = false;

  @Input()
  set listSubtotales(val: any) {
    this._listSubtotales = val;
  }

  myForm: FormGroup;
  loadConsulta = false;
  isNuevoCliente = false; // si es nuevo cliente manda a guardar
  direccionCliente: any = {};

  dateInfoSede;
  metodoPagoSelected: MetodoPagoModel;
  isRecojoLocalCheked = false;
  isAceptaRecojoLocal = true;

  infoEstablecimiento: DeliveryEstablecimiento;

  // latitude: number;
  // longitude: number;
  // address = '';
  // dataMapa: any;
  // private geoCoder;

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
    buscarRepartidor: true,
    isFromComercio: 1, // el pedido esta yendo desde el comercio,
    costoTotalDelivery: 0
  };

  dirEstablecimiento: DeliveryEstablecimiento;
  importeTota = 0;

  constructor(
    private fb: FormBuilder,
    private crudService: CrudHttpService,
    private dialogDireccion: MatDialog,
    private infoTokenService: InfoTockenService,
    private miPedidoService: MipedidoService,
    private dialog: MatDialog,
    private establecimientoService: EstablecimientoService,
    private calcDistanceService: CalcDistanciaService
    // private mapsAPILoader: MapsAPILoader,
    // private ngZone: NgZone,
    ) { }

  ngOnInit() {

    this.direccionCliente = {
      titulo: 'Seleccione una direccion',
      direccion: '',
      referencia: ''
    };

    this.infoTokenService.setIniMetodoPago('Efectivo');
    this.metodoPagoSelected = this.infoTokenService.infoUsToken.metodoPago;
    // this.dateInfoSede = this.miPedidoService.objDatosSede.datossede[0];

    this.dirEstablecimiento = this.establecimientoService.get();

    //  this.dateInfoSede.pwa_delivery_habilitar_recojo_local
    this.isAceptaRecojoLocal = this.establecimientoService.establecimiento.pwa_delivery_habilitar_recojo_local === 1;

    this.myForm = this.fb.group({
      idcliente: new FormControl('', [Validators.required]),
      dni: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      f_nac: new FormControl(''),
      // direccion: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      // paga_con: new FormControl('', [Validators.required]),
      dato_adicional: new FormControl('')
    });

    this.myForm.statusChanges.subscribe(res => {
      this.isValid = res === 'VALID' ? true : false;
      // const dataEmit = {
      //   formIsValid: isValid,
      //   isNuevoCliente: this.isNuevoCliente,
      //   formData: this.myForm.value,
      //   direccionMapsSave: this.direccionCliente // direccion guardar en el cliente
      // };

      // setear respuest
      // console.log('form delivery', dataEmit);
      this.setearData();
      // this.changeStatus.emit(dataEmit);
    });


    this.infoEstablecimiento = this.establecimientoService.get();

  }

  setearData() {
      this.isValid = this.myForm.status === 'VALID' ? true : false;

      this.resData.idcliente = this.myForm.controls.idcliente.value || null;
      this.resData.dni = this.myForm.controls.dni.value;
      this.resData.nombre = this.myForm.controls.nombre.value;
      this.resData.f_nac = this.myForm.controls.f_nac.value;
      // this.resData.direccion = this.myForm.controls.direccion.value.toString();
      this.resData.telefono = this.myForm.controls.telefono.value;
      // this.resData.paga_con = this.myForm.controls.paga_con.value.toString();
      this.resData.importeTotal = this.getTotalPedido();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe || '';
      this.resData.dato_adicional = this.myForm.controls.dato_adicional.value;
      this.resData.metodoPago = this.metodoPagoSelected;
      this.resData.tipoComprobante = this.infoTokenService.getInfoUs().tipoComprobante;
      this.resData.direccionEnvioSelected = this.direccionCliente;
      this.resData.establecimiento = this.infoEstablecimiento;
      this.resData.referencia = this.direccionCliente.referencia;
      this.resData.direccion = this.direccionCliente.direccion;
      this.resData.subTotales = this._listSubtotales;
      this.resData.propina = this.infoTokenService.getInfoUs().propina;
      this.resData.pasoRecoger = this.isRecojoLocalCheked;
      this.resData.buscarRepartidor = this.establecimientoService.establecimiento.pwa_delivery_servicio_propio === 0;
      this.resData.costoTotalDelivery = this.infoEstablecimiento.costo_total_servicio_delivery;
      // this.resData.establecimiento = this.infoEstablecimiento;

      // console.log('this.resData emit', this.resData);
      if ( !this.direccionCliente.codigo && !this.isRecojoLocalCheked ) { this.isValid = false; }

      const dataEmit = {
        formIsValid: this.isValid,
        isNuevoCliente: this.isNuevoCliente,
        formData: this.resData,
        direccionMapsSave: this.direccionCliente // direccion guardar en el cliente
      };

      this.changeStatus.emit(dataEmit);
  }

  buscarDNI(): void {
    const datos = {
      documento : this.myForm.controls.dni.value
    };

    this.loadConsulta = true;
    this.isNuevoCliente = false;
    this.limpiarForm(datos.documento);

    // primero consultamos en la bd
    this.crudService.postFree(datos, 'service', 'consulta-dni-ruc', true)
    .subscribe((res: any) => {
      // console.log(res);
      const _datosBd = res.data;
      if ( res.success && _datosBd.length > 0 ) {
        this.myForm.controls.idcliente.patchValue(_datosBd[0].idcliente);
        this.myForm.controls.nombre.patchValue(_datosBd[0].nombres);
        this.myForm.controls.f_nac.patchValue(_datosBd[0].f_nac);
        // this.myForm.controls.direccion.patchValue(_datosBd[0].direccion);
        this.myForm.controls.telefono.patchValue(_datosBd[0].telefono);
        this.loadConsulta = false;
        this.isNuevoCliente = false;
      } else {

        this.crudService.getConsultaRucDni('dni', datos.documento)
        .subscribe((_res: any) => {
          if (_res.success) {
            const _datos = _res.data;
            const _nombre = `${_datos.names} ${_datos.first_name} ${_datos.last_name}`;
            this.myForm.controls.idcliente.patchValue(0);
            this.myForm.controls.nombre.patchValue(_nombre);
            this.myForm.controls.f_nac.patchValue(_datos.date_of_birthday);
            this.isNuevoCliente = true;
          } else {
            this.limpiarForm(datos.documento);
          }
          this.loadConsulta = false;
          this.resData.idcliente = '0';
        });

      }
    });

  }

  private limpiarForm(dni: string): void {
    this.myForm.reset();
    this.myForm.controls.dni.patchValue(dni);
  }


  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();

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
        this.direccionCliente = <DeliveryDireccionCliente>data;

        // esto para poder guardar en el procedure
        this.direccionCliente.idcliente_pwa_direccion = this.direccionCliente.idcliente_pwa_direccion === null ? 0 : this.direccionCliente.idcliente_pwa_direccion;


        this.calcDistanceService.calculateRoute(<DeliveryDireccionCliente>data, this.dirEstablecimiento);

        // recalcular
        setTimeout(() => {
          // console.log('this.dirEstablecimiento', this.dirEstablecimiento);

          this.establecimientoService.set(this.dirEstablecimiento);

          const _arrSubtotales = this.miPedidoService.getArrSubTotales(this.dirEstablecimiento.rulesSubTotales);
          localStorage.setItem('sys::st', btoa(JSON.stringify(_arrSubtotales)));

          this._listSubtotales = _arrSubtotales;

          // console.log('_arrSubtotales', _arrSubtotales);
          this.setearData();
        }, 600);

      }
    );
  }


  // cuando el recojo es en el local
  recalcularTotales(): void {
    if ( this.isRecojoLocalCheked ) {
      // propina se vielve 0
      // this.propinaSelected = {'idpropina': 1, 'value': 0 , 'descripcion': 'S/. 0', 'checked': true};
      // this.infoTokenService.setPropina(this.propinaSelected);

      // recalcular subtotales
      // lista temporal para back
      this._listSubtotalesTmp = JSON.parse(JSON.stringify(this._listSubtotales));

      const rowTotal = this._listSubtotales[this._listSubtotales.length - 1];
      this._listSubtotales = this._listSubtotales.filter(x => x.id >= 0 && x.descripcion !== 'TOTAL');
      const _subtotal = this._listSubtotales.map((x: any) => parseFloat(x.importe)).reduce((a, b) => a + b, 0);
      rowTotal.importe = _subtotal;
      this._listSubtotales.push(rowTotal);

    } else {
      this._listSubtotales = this._listSubtotalesTmp;
    }

    // console.log('this._listSubtotales', this._listSubtotales);
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._listSubtotales)));
    this.infoTokenService.setPasoRecoger(this.isRecojoLocalCheked);

    this.setearData();
    // this.verificarMontoMinimo();
  }

  openDialogMetodoPago(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;

    _dialogConfig.data = {
      importeTotalPagar: this._listSubtotales[this._listSubtotales.length - 1].importe,
      excluirId: 2 // id exlcluir
    };

    const dialogLoading = this.dialog.open(DialogMetodoPagoComponent, _dialogConfig);
      dialogLoading.afterClosed().subscribe((result: MetodoPagoModel) => {
        this.metodoPagoSelected = result;
        // console.log(result);
        // this.verificarMontoMinimo();
        this.setearData();
      });
  }

  private getTotalPedido(): number {
    return this._listSubtotales[this._listSubtotales.length - 1].importe;
  }

}
