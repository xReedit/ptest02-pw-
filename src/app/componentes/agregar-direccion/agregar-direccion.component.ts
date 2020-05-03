import { Component, OnInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-agregar-direccion',
  templateUrl: './agregar-direccion.component.html',
  styleUrls: ['./agregar-direccion.component.css']
})
export class AgregarDireccionComponent implements OnInit {
  // title = 'AGM project';
  latitude: number;
  longitude: number;
  dataMapa: any;
  zoom: number;
  address: string;
  loader = 0;
  private geoCoder;

  registerForm: FormGroup;
  dataCliente: DeliveryDireccionCliente;
  // dataCliente: any = {
  //   isvalid: false,
  //   idcliente: '',
  //   direccion: '',
  //   referencia: '',
  //   latitude: this.latitude,
  //   longitude: this.longitude,
  //   titulo: '',
  //   ciudad: '',
  //   provincia: '',
  //   departamento: '',
  //   pais: '',
  //   codigo: ''
  // };

  private dataInfoSede: any;

  @ViewChild('search', {static: false}) public searchElementRef: ElementRef;
  @ViewChild('registerForm', {static: false}) myForm;

  @Input() isGuardarDireccion = true;

  @Output() dataMaps = new EventEmitter<any>();
  @Output() saveDireccionOk = new EventEmitter<DeliveryDireccionCliente>();

  isDireccionValid = true; // si esta dentro de la zona de atencion

  constructor(
    private formBuilder: FormBuilder,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private verifyClientService: VerifyAuthClientService,
    private crudService: CrudHttpService,
    private miPedidoService: MipedidoService,
    private inforTokenService: InfoTockenService,
  ) { }

  ngOnInit() {

    this.dataCliente = new DeliveryDireccionCliente();
    this.loadForm();
    // this.setCurrentLocation();

    // load Places Autocomplete
    this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation();
      this.geoCoder = new google.maps.Geocoder;

      const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        types: ['address'],
        componentRestrictions: { country: 'pe' }
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 15;

          this.getAddress(this.latitude , this.longitude);
        });
      });


    });
  }

  private setCurrentLocation() {

    // se pide la direccion desde el comercio // registrar pedido
    if (this.inforTokenService.getInfoUs().isCliente === false ) {
      this.dataInfoSede = this.miPedidoService.objDatosSede.datossede[0];
      this.latitude = this.dataInfoSede.latitude;
      this.longitude = this.dataInfoSede.longitude;


      return;
    }


    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 16;
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }

  markerDragEnd($event: any) {
    // console.log($event);
    this.latitude = $event.coords.lat;
    this.longitude = $event.coords.lng;
    this.getAddress(this.latitude, this.longitude);
  }

  getAddress(latitude, longitude) {
    // this.isDireccionValid = true;
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
      // console.log(results);
      // console.log(status);
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 15;
          this.address = results[0].formatted_address;
          this.dataCliente.direccion = this.address;
          this.dataMapa = results[0];

          // si es usuario comercio valida la direccion del cliente
          if ( !this.inforTokenService.getInfoUs().isCliente ) {
            const codigo_postal = this.searchTypeMap('postal_code');
            if ( codigo_postal !== this.dataInfoSede.codigo_postal ) {
              this.isDireccionValid = false;
              // window.alert('El servicio no esta disponible en esta ubicacion');
            } else {
              this.isDireccionValid = true;
            }
          }
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

      // console.log('this.dataCliente', this.dataCliente);
      // console.log('this.dataMapa', this.dataMapa);
    });
  }

  private loadForm() {
    this.registerForm = this.formBuilder.group({
      direccion: ['', Validators.required],
      referencia: [this.dataCliente.referencia, Validators.required],
      longitude: [this.longitude, Validators.required],
      latitude: [this.latitude, Validators.required],
      titulo: this.dataCliente.titulo || ''
    });


    this.registerForm.statusChanges.subscribe(res => {
      if ( res === 'VALID' ) {
        this.guardarDireccion();
      }
    });
  }


  checkDireccion(value: string) {
    if ( value.trim() === '' ) {
      this.longitude = null;
      this.latitude = null;
    }
  }

  guardarDireccion() {

    if (!this.isDireccionValid) {
      // window.alert('El servicio no esta disponible en esta ubicacion');
      return ;
    }
    // this.loader = 1;
    this.dataCliente.idcliente = this.verifyClientService.getDataClient().idcliente;
    this.dataCliente.longitude = this.longitude;
    this.dataCliente.latitude = this.latitude;
    // this.dataCliente.referencia =
    this.dataCliente.ciudad = this.searchTypeMap('locality');
    this.dataCliente.provincia = this.searchTypeMap('administrative_area_level_2');
    this.dataCliente.departamento = this.searchTypeMap('administrative_area_level_1');
    this.dataCliente.pais = this.searchTypeMap('country');
    this.dataCliente.codigo = this.searchTypeMap('postal_code');
    // this.dataCliente.isvalid = true;

    // this.dataMaps.emit(this.dataCliente);
    // console.log('this.dataMapa', this.dataMapa);
    //

    // console.log(data);
    // console.log(this.dataCliente);

    // guardar cambios
    // this.crudService.postFree(this.dataCliente, 'cliente', 'new-direccion', false)
    //   .subscribe((res: any) => {
    //     setTimeout(() => {
    //       this.loader = 2;
    //     }, 1000);

    //     console.log(res);
    //   });
  }

  saveDireccion() {
    this.loader = 1;
    if ( !this.isGuardarDireccion ) { // si no guarda retorna solo la direccion //
      this.loader = 2;
      this.dataCliente.idcliente_pwa_direccion = null;
      this.saveDireccionOk.emit(this.dataCliente);
      return;
    }

    this.crudService.postFree(this.dataCliente, 'cliente', 'new-direccion', false)
      .subscribe((res: any) => {
        setTimeout(() => {
          this.loader = 2;
          setTimeout(() => {
            this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
            this.saveDireccionOk.emit(this.dataCliente);
          }, 500);
        }, 1000);
        // console.log(res);
      });
  }

  private searchTypeMap(search: string): string {
    let rpt = '';
    this.dataMapa.address_components.map((x: any) => {
      x.types.map( (t: any) => {
        if (t === search) {
          rpt = x.long_name;
          return rpt;
        }
      });
    });
    return rpt;
  }

}
