import { Component, OnInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { AgmMap, MapsAPILoader } from '@agm/core';
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
export class AgregarDireccionComponent implements OnInit, AfterViewInit {
  // title = 'AGM project';
  latitude: number;
  longitude: number;
  dataMapa: any;
  zoom: number;
  address: string;
  loader = 0;

  isUsCliente = true; // si el usuario es cliente o usuario autorizado
  countMoveMap = 0;

  @Input() idClienteBuscar: number; // cuando el pedido lo toma el mismo comercio

  private isChangeDireccion = true;
  private geoCoder;

  registerForm: FormGroup;
  dataCliente: DeliveryDireccionCliente;
  checkekFirstOption = true;
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

  @ViewChild('search') public searchElementRef: ElementRef;
  @ViewChild('registerForm') myForm;

  @Input() isGuardarDireccion = true;

  @Output() dataMaps = new EventEmitter<any>();
  @Output() saveDireccionOk = new EventEmitter<DeliveryDireccionCliente>();

  isDireccionValid = true; // si esta dentro de la zona de atencion


  @ViewChild('search') agmMap;


  mapCenter: any = {};
  map: any;

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
    this.inforTokenService.getInfoUs();
    this.isUsCliente = this.inforTokenService.getInfoUs().isCliente;
    // console.log('this.inforTokenService.getInfoUs()', this.inforTokenService.getInfoUs());
    this.loadForm();
  }

  ngAfterViewInit(): void {
    this.loadInitComponent();
  }

  private  loadInitComponent() {
    // this.setCurrentLocation();

    // load Places Autocomplete
    this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation();
      this.geoCoder = new google.maps.Geocoder;

      const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        // types: ['address'],
        componentRestrictions: { country: 'pe' }
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          // get the place result
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();

          // console.log('place', place);
          this.countMoveMap = 0;
          this.dataMapa = place; // para extract data
          this.address = place.formatted_address;

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 17;
          this.isChangeDireccion = false;

          // actualiza marcador pantalla
          this.mapCenter.lng = this.latitude;
          this.mapCenter.lat = this.longitude;

          setTimeout(() => {
            this.isChangeDireccion = true;
          }, 500);

          // this.getAddress(this.latitude , this.longitude);
        });
      });


    });
  }

  private setCurrentLocation() {

    // se pide la direccion desde el comercio // registrar pedido
    if (this.isUsCliente === false ) {
      this.dataInfoSede = this.miPedidoService.objDatosSede.datossede[0];
      this.latitude = this.dataInfoSede.latitude;
      this.longitude = this.dataInfoSede.longitude;
      this.zoom = 17;
      return;
    }


    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 17;
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }

  markerDragEnd($event: any) {
    // console.log($event);
    this.latitude = $event.coords.lat;
    this.longitude = $event.coords.lng;
    // console.log('this.latitude markter',  this.latitude);
    // console.log('this.longitude markter',  this.longitude);
    // this.getAddress(this.latitude, this.longitude);
  }

  getAddress(latitude, longitude) {
    // this.isDireccionValid = true;
    // const palce_id = placeId ? {'placeId': placeId} : { 'location': { lat: latitude, lng: longitude } };
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
    // this.geoCoder.geocode(palce_id, (results, status) => {
      // console.log(results);
      // console.log(status);
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 17;
          this.address = results[0].formatted_address;
          this.dataMapa = results[0];

          // console.log('this.dataMapa', this.dataMapa);

          if ( this.isChangeDireccion ) {
            this.dataCliente.direccion = this.address;
          }

          // si es usuario comercio valida la direccion del cliente
          if ( !this.isUsCliente ) {
            const codigo_postal = this.searchTypeMap('locality');
            // console.log('codigo_postal', codigo_postal);
            // console.log('this.dataInfoSede', this.dataInfoSede);
            if ( codigo_postal.toLowerCase().trim() !== this.dataInfoSede.ciudad.toLowerCase().trim() ) {
              this.isDireccionValid = false;
              // window.alert('El servicio no esta disponible en esta ubicacion');
            } else {
              this.isDireccionValid = true;
            }
          }
        } else {
          // window.alert('No results found');
        }
      } else {
        // window.alert('Geocoder failed due to: ' + status);
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
      titulo: this.dataCliente.titulo || 'Casa'
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

    // this.latitude = this.mapCenter.lat;
    // this.longitude = this.mapCenter.lng;

    // this.loader = 1;
    this.dataCliente.direccion = this.address;
    this.dataCliente.idcliente = this.isUsCliente ? this.verifyClientService.getDataClient().idcliente : this.idClienteBuscar;
    this.dataCliente.longitude = this.mapCenter.lng;
    this.dataCliente.latitude = this.mapCenter.lat;
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
    this.dataCliente.titulo = this.dataCliente.titulo || 'Casa';
    if ( !this.isGuardarDireccion ) { // si no guarda retorna solo la direccion //
      this.loader = 2;
      this.dataCliente.idcliente_pwa_direccion = null;
      this.saveDireccionOk.emit(this.dataCliente);
      return;
    }

    // this.mapCenter.lat, this.mapCenter.lng

    // console.log('this.mapCenter', this.mapCenter);
    if ( this.isUsCliente && this.countMoveMap > 1) {
      this.getAddress(this.mapCenter.lat, this.mapCenter.lng);

      setTimeout(() => {
        this.guardarDireccion();
        this.setBdDireccion();
      }, 1500);

    } else {
      this.setBdDireccion();
    }

    // actualiza las coordenadas segun position del marcador
    // this.dataCliente.latitude = this.mapCenter.lat;
    // this.dataCliente.longitude = this.mapCenter.lng;

  }

  private setBdDireccion() {
    this.crudService.postFree(this.dataCliente, 'cliente', 'new-direccion', false)
      .subscribe((res: any) => {
        setTimeout(() => {
          this.loader = 2;
          setTimeout(() => {
            // console.log('new-direccion', res);
            this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
            this.saveDireccionOk.emit(this.dataCliente);
            this.countMoveMap = 1;
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



  protected mapReady(map) {
    this.map = map;
  }

  public markerClicked = (markerObj) => {
    if (this.map) {
      this.map.setCenter({ lat: markerObj.latitude, lng: markerObj.longitude });
      // console.log('clicked', markerObj, { lat: markerObj.latitude, lng: markerObj.longitude });
    }
  }

  idleMap() {
    this.countMoveMap++;
    // console.log('this.mapCenter', this.mapCenter);
    // this.getAddress(this.mapCenter.lat, this.mapCenter.lng);
  }

  centerChange(event: any) {
    if (event) {
      this.mapCenter.lat = event.lat;
      this.mapCenter.lng = event.lng;

      // const latLong = new google.maps.LatLng(event.lat, event.lng);
      // this.mapCenter = latLong;
      // console.log(this.mapCenter);
    }
  }

  clickmap() {
    // console.log('click map');
    this.isChangeDireccion = true;
  }

  confirmarDireccion() {
    this.countMoveMap = 1;
    this.getAddress(this.mapCenter.lat, this.mapCenter.lng);
  }

}
