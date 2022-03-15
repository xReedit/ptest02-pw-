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
import { Observable } from 'rxjs/internal/Observable';
// import { startWith } from 'rxjs/internal/operators/startWith';
// import { map } from 'rxjs/internal/operators/map';
import { TiempoEntregaModel } from 'src/app/modelos/tiempo.entrega.model';
import { DialogTiempoEntregaComponent } from '../dialog-tiempo-entrega/dialog-tiempo-entrega.component';
import { debounceTime, distinctUntilChanged, switchMap, map, startWith } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { ClienteService } from 'src/app/shared/services/cliente.service';
// import { MapsAPILoader } from '@agm/core';

@Component({
  selector: 'app-datos-delivery',
  templateUrl: './datos-delivery.component.html',
  styleUrls: ['./datos-delivery.component.css']
})
export class DatosDeliveryComponent implements OnInit {
  @ViewChild('search') public searchElementRef: ElementRef;

  @Output() public changeStatus = new EventEmitter<any>();

  _listSubtotalesTmp: any;
  _listSubtotales: any;
  isDataFromDNI = false; // si utilizo el dni para registrar
  errorDni = false;

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

  dataListClientes: any = [];
  filteredOptions: Observable<any[]>;
  myControl = new FormControl();
  clienteSelectBusqueda: any;

  infoEstablecimiento: DeliveryEstablecimiento;
  tiempoEntregaSelected: TiempoEntregaModel;
  rippleColor = 'rgb(255,238,88, 0.3)';

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
    costoTotalDelivery: 0,
    tiempoEntregaProgamado: {},
    num_verificador: '',
    solicitaCubiertos: 0
  };

  dirEstablecimiento: DeliveryEstablecimiento;
  importeTota = 0;

  isShowAddDireccionMapa = true; // si esta habilitado busqueda en el mapa

  isCubierto = false;

  constructor(
    private fb: FormBuilder,
    private crudService: CrudHttpService,
    private dialogDireccion: MatDialog,
    private infoTokenService: InfoTockenService,
    private miPedidoService: MipedidoService,
    private dialog: MatDialog,
    private establecimientoService: EstablecimientoService,
    private calcDistanceService: CalcDistanciaService,
    private dialogTipoComprobante: MatDialog,
    private utilService: UtilitariosService,
    private clienteService: ClienteService
    // private mapsAPILoader: MapsAPILoader,
    // private ngZone: NgZone,
    ) { }

  ngOnInit() {

    this.direccionCliente = {
      titulo: 'Seleccione una direccion *',
      direccion: '',
      referencia: ''
    };




    this.tiempoEntregaSelected = new TiempoEntregaModel();
    // if ( this.infoTokenService.infoUsToken.tiempoEntrega ) {
    //   this.tiempoEntregaSelected = this.infoTokenService.infoUsToken.tiempoEntrega;
    //   // return;
    // } else {
    //   // this.isTiempoEntregaValid = false;
    // }
    this.tiempoEntregaSelected.descripcion = 'Programa la entrega';
    this.tiempoEntregaSelected.value = '';
    this.tiempoEntregaSelected.modificado = false;

    this.infoTokenService.setIniMetodoPago('Efectivo');
    this.metodoPagoSelected = this.infoTokenService.infoUsToken.metodoPago;
    // this.dateInfoSede = this.miPedidoService.objDatosSede.datossede[0];

    this.dirEstablecimiento = this.establecimientoService.get();

    //  this.dateInfoSede.pwa_delivery_habilitar_recojo_local
    this.isAceptaRecojoLocal = this.establecimientoService.establecimiento.pwa_delivery_habilitar_recojo_local === 1;

    this.myForm = this.fb.group({
      idcliente: new FormControl(''),
      dni: new FormControl(''),
      nombre: new FormControl('', [Validators.required]),
      f_nac: new FormControl(''),
      // direccion: new FormControl('', [Validators.required]),
      telefono: new FormControl(''),
      // paga_con: new FormControl('', [Validators.required]),
      dato_adicional: new FormControl(''),
      num_verificador: new FormControl('')
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

      this.setearData();
      // this.changeStatus.emit(dataEmit);
    });


    this.infoEstablecimiento = this.establecimientoService.get();

    this.isShowAddDireccionMapa = this.infoEstablecimiento.pwa_habilitar_busqueda_mapa === 1;

    // traer todos los clientes
    // this.getAllClientes();


    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        // debounceTime(400), // al poner esto no actualiza formulario
        // distinctUntilChanged(),
        startWith(''),
        switchMap(value => {
          return this._filter(value);
        }),
        map(res => this.dataListClientes = res)
        // map(value => this._filter(value))
      );

  }

  setTextDirClienteNoMapa(val: string) {
    this.direccionCliente.direccion = this.utilService.addslashes(val);
    this.setearData();
  }

  setearData() {
      this.isValid = this.myForm.status === 'VALID' ? true : false;

      this.resData.idcliente = this.myForm.controls.idcliente.value || null;
      this.resData.dni = this.myForm.controls.dni.value;
      this.resData.nombre = this.myForm.controls.nombre.value;
      this.resData.f_nac = this.myForm.controls.f_nac.value;
      this.resData.num_verificador = this.myForm.controls.num_verificador.value;
      // this.resData.direccion = this.myForm.controls.direccion.value.toString();
      this.resData.telefono = this.myForm.controls.telefono.value;
      // this.resData.paga_con = this.myForm.controls.paga_con.value.toString();
      this.resData.importeTotal = this.getTotalPedido();
      this.resData.paga_con = this.metodoPagoSelected.descripcion + '  ' + this.metodoPagoSelected.importe || '';
      this.resData.dato_adicional = this.myForm.controls.dato_adicional.value;
      this.resData.metodoPago = this.metodoPagoSelected;
      this.resData.tipoComprobante = this.infoTokenService.getInfoUs().tipoComprobante;
      this.resData.direccionEnvioSelected = this.direccionCliente;
      this.resData.tiempoEntregaProgamado = this.tiempoEntregaSelected;
      this.resData.establecimiento = this.infoEstablecimiento;
      this.resData.referencia = this.direccionCliente.referencia === '' ? this.resData.nombre : this.utilService.addslashes(this.direccionCliente.referencia);
      this.resData.direccion = this.direccionCliente.direccion;
      this.resData.subTotales = this._listSubtotales;
      this.resData.propina = this.infoTokenService.getInfoUs().propina;
      this.resData.pasoRecoger = this.isRecojoLocalCheked;
      this.resData.buscarRepartidor = this.establecimientoService.establecimiento.pwa_delivery_servicio_propio === 0;
      this.resData.costoTotalDelivery = this.infoEstablecimiento.c_servicio; // this.infoEstablecimiento.costo_total_servicio_delivery;
      this.resData.solicitaCubiertos = this.isCubierto ? 1 : 0;
      // this.resData.establecimiento = this.infoEstablecimiento;


      if ( this.isShowAddDireccionMapa ) {
        if ( !this.direccionCliente.ciudad && !this.isRecojoLocalCheked ) { this.isValid = false; }
      }

      const dataEmit = {
        formIsValid: this.isValid,
        isNuevoCliente: this.isNuevoCliente,
        formData: this.resData,
        direccionMapsSave: this.direccionCliente // direccion guardar en el cliente
      };

      this.changeStatus.emit(dataEmit);
  }

  buscarDNI(): void {
    this.errorDni = false;
    if ( this.myForm.controls.dni.value.length < 8 ) { this.errorDni = true; return; }
    const datos = {
      documento : this.myForm.controls.dni.value
    };

    this.loadConsulta = true;
    this.isNuevoCliente = false;
    this.limpiarForm(datos.documento);
    this.isDataFromDNI = true;

    // primero consultamos en la bd
    this.crudService.postFree(datos, 'service', 'consulta-dni-ruc', true)
    .subscribe((res: any) => {
      const _datosBd = res.data;
      if ( res.success && _datosBd.length > 0 ) {
        this.myForm.controls.idcliente.patchValue(_datosBd[0].idcliente);
        this.myForm.controls.nombre.patchValue(_datosBd[0].nombres);
        this.myForm.controls.f_nac.patchValue(_datosBd[0].f_nac);
        this.myForm.controls.num_verificador.patchValue('');

        this.myControl.patchValue(_datosBd[0].nombres);

        // this.myForm.controls.direccion.patchValue(_datosBd[0].direccion);
        this.myForm.controls.telefono.patchValue(_datosBd[0].telefono);
        this.loadConsulta = false;
        this.isNuevoCliente = false;
        this.errorDni = false;

        // verificar datos en el api y actualizar
        if ( _datosBd[0].dni_num_verificador == null ) {
          this.clienteService.serchClienteByDni(datos.documento).subscribe((resClienteApi: any) => {
            this.myForm.controls.f_nac.patchValue(resClienteApi.date_of_birthday);
            this.myForm.controls.num_verificador.patchValue(resClienteApi.verification_code);
          });
        }

      } else {

        this.crudService.getConsultaRucDni('dni', datos.documento)
        .subscribe((_res: any) => {
          if (_res.success) {
            const _datos = _res.data;
            const _nombre = `${_datos.name} ${_datos.first_name} ${_datos.last_name}`;
            this.myForm.controls.idcliente.patchValue(0);
            this.myForm.controls.nombre.patchValue(_nombre);
            this.myForm.controls.f_nac.patchValue(_datos.date_of_birthday);
            this.myForm.controls.num_verificador.patchValue(_datos.verification_code);
            this.isNuevoCliente = true;
            this.errorDni = false;
          } else {
            this.limpiarForm(datos.documento);
            this.isDataFromDNI = false;
            this.errorDni = true;
          }
          this.loadConsulta = false;
          this.resData.idcliente = '0';
        });

      }

      // this.isDataFromDNI = true;
    });

  }

  private limpiarForm(dni: string): void {
    this.myForm.reset();
    this.myForm.controls.dni.patchValue(dni);
  }

  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();
    this.resData.idcliente =  this.resData.idcliente !== '' ? this.resData.idcliente : this.clienteSelectBusqueda ? this.clienteSelectBusqueda.idcliente : '';
    const _DdialogConfig = new MatDialogConfig();
    // _DdialogConfig.disableClose = false,
    _DdialogConfig.disableClose = true;
    _DdialogConfig.hasBackdrop = true;
    _DdialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    _DdialogConfig.data = {
      isGuardar: this.infoTokenService.infoUsToken.idcliente ? true : false, // no guarda sole devuelve los datos de la direccion
      isFromComercio: true, // para empezar en la posicion del comercio
      idClienteBuscar: this.resData.idcliente
    };


    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, _DdialogConfig);

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }

        this.direccionCliente = <DeliveryDireccionCliente>data;

        // esto para poder guardar en el procedure
        this.direccionCliente.idcliente_pwa_direccion = this.direccionCliente.idcliente_pwa_direccion === null ? 0 : this.direccionCliente.idcliente_pwa_direccion;


        // console.log('aaaa calculateRoute');
        let c_servicio = this.calcDistanceService.calculateRoute(<DeliveryDireccionCliente>data, this.dirEstablecimiento, false);


        // recalcular
        setTimeout(() => {

          c_servicio = this.dirEstablecimiento.c_servicio;
          this.establecimientoService.set(this.dirEstablecimiento);
          this.infoEstablecimiento.c_servicio = c_servicio; // this.dirEstablecimiento.c_servicio;
          this.resData.costoTotalDelivery = c_servicio; // this.dirEstablecimiento.c_servicio; // this.infoEstablecimiento.costo_total_servicio_delivery;

          const _arrSubtotales = this.miPedidoService.getArrSubTotales(this.dirEstablecimiento.rulesSubTotales);
          localStorage.setItem('sys::st', btoa(JSON.stringify(_arrSubtotales)));

          this._listSubtotales = _arrSubtotales;


          this.setearData();
        }, 800);

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


      // quita los requerimientos y no graba al cliente cuando viene a llevar
      // this.myForm.controls.idcliente.setValidators(null);
      this.myForm.controls.telefono.setValidators(null);

    } else {
      // this.myForm.controls.idcliente.setValidators([Validators.required]);
      this.myForm.controls.telefono.setValidators([Validators.required]);
      this._listSubtotales = this._listSubtotalesTmp;
    }


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
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    _dialogConfig.data = {
      importeTotalPagar: this._listSubtotales[this._listSubtotales.length - 1].importe,
      excluirId: 2 // id exlcluir
    };

    const dialogLoading = this.dialog.open(DialogMetodoPagoComponent, _dialogConfig);
      dialogLoading.afterClosed().subscribe((result: MetodoPagoModel) => {
        this.metodoPagoSelected = result;

        // this.verificarMontoMinimo();
        this.setearData();
      });
  }

  private getTotalPedido(): number {
    return this._listSubtotales[this._listSubtotales.length - 1].importe;
  }


  // data all clientes
  // getAllClientes() {
  //   this.crudService.getAll('pedido', 'get-all-clientes', false, false, true)
  //   .subscribe((res: any) => {
  //     this.dataListClientes = res.data;
  //   });
  // }

  // getSearCliente(search: string): Observable<any[]>  {
  //   return this.establecimientoService.getClienteAutocomplete(search);
  // }

  private _filter(value: string): Observable<any[]> {
    if ( this.isDataFromDNI ) { return EMPTY; }
    if ( value.length < 5 ) {return EMPTY; }

    if ( typeof value === 'object' ) { this.selectedClienteBusqueda(value); return EMPTY; }
    this.limpiarForm('');
    return this.establecimientoService.getClienteAutocomplete(value);




    // const filterValue = value.toLowerCase();
    // this.limpiarForm('');
    // return this.dataListClientes; // .filter(option => option.nombres.toLowerCase().includes(filterValue));

  }

  changeCliente($event: any) {

  }

  displayFn(option?: any): string  {
    return option ? option.nombres : '';
    }

  private selectedClienteBusqueda(cliente: any) {
    this.clienteSelectBusqueda = cliente;

    this.myForm.controls.idcliente.patchValue(cliente.idcliente);
    this.myForm.controls.nombre.patchValue(cliente.nombres);
    this.myForm.controls.dni.patchValue(cliente.ruc);
    // this.myForm.controls.f_nac.patchValue(cliente.f_nac);
    // this.myForm.controls.direccion.patchValue(_datosBd[0].direccion);
    this.myForm.controls.telefono.patchValue(cliente.telefono);
  }

  setNombreControl(nom: string) {
    this.myForm.controls.nombre.patchValue(nom);
  }


  openDialogTiempoEntrega(): void {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.width = '380px';
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    const dialogTpC = this.dialogTipoComprobante.open(DialogTiempoEntregaComponent, _dialogConfig);
    dialogTpC.afterClosed().subscribe((result: TiempoEntregaModel) => {

        if ( result ) {
          // this.infoTokenService.setTiempoEntrega(result);
          this.tiempoEntregaSelected = result;
          this.setearData();
          // this.verificarMontoMinimo();
        }
      });
  }

}
