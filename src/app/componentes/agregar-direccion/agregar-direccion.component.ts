import { Component, OnInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { GoogleMap, MapMarker, GoogleMapsModule } from '@angular/google-maps';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';

declare var google: any;

@Component({
  selector: 'app-agregar-direccion',
  templateUrl: './agregar-direccion.component.html',
  styleUrls: ['./agregar-direccion.component.css']
})
export class AgregarDireccionComponent implements OnInit, AfterViewInit {
  latitude: number;
  longitude: number;
  dataMapa: any;
  zoom: number = 17;
  address: string;
  loader = 0;
  dirInCoordenadas = false;

  // Opciones del mapa
  mapOptions: google.maps.MapOptions = {
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    mapTypeId: 'roadmap'
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: true
  };

  isUsCliente = true;
  countMoveMap = 0;

  @Input() idClienteBuscar: number;

  private isChangeDireccion = true;
  private geoCoder: google.maps.Geocoder;

  registerForm: UntypedFormGroup;
  dataCliente: DeliveryDireccionCliente;
  checkekFirstOption = true;

  private dataInfoSede: any;

  @ViewChild('search') public searchElementRef: ElementRef;
  @ViewChild('map') map: GoogleMap;
  @ViewChild('registerForm') myForm;

  @Input() isGuardarDireccion = true;

  @Output() dataMaps = new EventEmitter<any>();
  @Output() saveDireccionOk = new EventEmitter<DeliveryDireccionCliente>();

  isDireccionValid = true;

  mapCenter: google.maps.LatLngLiteral;

  _componentRestrictions: any = { country: 'pe' };

  constructor(
    private formBuilder: UntypedFormBuilder,
    private ngZone: NgZone,
    private verifyClientService: VerifyAuthClientService,
    private crudService: CrudHttpService,
    private miPedidoService: MipedidoService,
    private inforTokenService: InfoTockenService,
    private utilService: UtilitariosService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit() {
    this.dataCliente = new DeliveryDireccionCliente();
    this.inforTokenService.getInfoUs();
    this.isUsCliente = this.inforTokenService.getInfoUs().isCliente;
    this.loadForm();
  }

  ngAfterViewInit(): void {
    this.loadInitComponent();
  }

  private loadInitComponent() {
    this.geoCoder = new google.maps.Geocoder();
    this.setCurrentLocation();

    const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
      componentRestrictions: this._componentRestrictions
    });

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult = autocomplete.getPlace();

        this.countMoveMap = 0;
        this.dataMapa = place;
        this.address = place.formatted_address;

        if (place.geometry === undefined || place.geometry === null) {
          return;
        }

        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();
        this.isChangeDireccion = false;

        this.mapCenter = {
          lat: this.latitude,
          lng: this.longitude
        };

        setTimeout(() => {
          this.isChangeDireccion = true;
        }, 500);
      });
    });
  }

  private setCurrentLocation() {
    if (this.isUsCliente === false) {
      this.dataInfoSede = this.miPedidoService.objDatosSede.datossede[0];
      this.latitude = this.dataInfoSede.latitude;
      this.longitude = this.dataInfoSede.longitude;
      this.mapCenter = {
        lat: this.latitude,
        lng: this.longitude
      };
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.mapCenter = {
          lat: this.latitude,
          lng: this.longitude
        };
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }

  markerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.latitude = event.latLng.lat();
      this.longitude = event.latLng.lng();
      this.mapCenter = {
        lat: this.latitude,
        lng: this.longitude
      };
    }
  }

  getDirCoordenadas(coodenadas: string) {
    const _coordenadas = coodenadas.split(',');
    const _lat = parseFloat(_coordenadas[0]);
    const _lon = parseFloat(_coordenadas[1]);
    this.latitude = _lat;
    this.longitude = _lon;
    this.mapCenter = {
      lat: _lat,
      lng: _lon
    };

    this.isChangeDireccion = true;
    this.getAddress(_lat, _lon);
  }

  getAddress(latitude, longitude) {

    // this.isDireccionValid = true;
    // const palce_id = placeId ? {'placeId': placeId} : { 'location': { lat: latitude, lng: longitude } };
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
    // this.geoCoder.geocode(palce_id, (results, status) => {

      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 17;
          this.address = results[0].formatted_address;
          this.dataMapa = results[0];



          if ( this.isChangeDireccion ) {
            this.dataCliente.direccion = this.address;
          }

          if ( this.dirInCoordenadas ) {
            this.registerForm.controls['direccion'].patchValue(this.dataCliente.direccion);
            // this.guardarDireccion(); // para el form valid
          }

          // si es usuario comercio valida la direccion del cliente
          if ( !this.isUsCliente ) {
            const codigo_postal = this.searchTypeMap('locality');

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
    this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
    this.dataCliente.ciudad = this.searchTypeMap('locality');
    this.dataCliente.provincia = this.searchTypeMap('administrative_area_level_2');
    this.dataCliente.departamento = this.searchTypeMap('administrative_area_level_1');
    this.dataCliente.pais = this.searchTypeMap('country');
    this.dataCliente.codigo = this.searchTypeMap('postal_code');


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

    this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
    this.crudService.postFree(this.dataCliente, 'cliente', 'new-direccion', false)
      .subscribe((res: any) => {
        setTimeout(() => {
          this.loader = 2;
          setTimeout(() => {
            this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
            this.saveDireccionOk.emit(this.dataCliente);
            this.countMoveMap = 1;
          }, 500);
        }, 1000);
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
    if (this.map && this.map.googleMap) {
      this.map.googleMap.setCenter({ lat: markerObj.latitude, lng: markerObj.longitude });
    }
  }

  idleMap() {
    this.countMoveMap++;
  }

  centerChange(event: any) {
    if (event) {
      this.mapCenter.lat = event.lat;
      this.mapCenter.lng = event.lng;
    }
  }

  clickmap() {
    this.isChangeDireccion = true;
  }

  confirmarDireccion() {
    this.countMoveMap = 1;
    this.getAddress(this.mapCenter.lat, this.mapCenter.lng);
  }

  recargarPage() {
    window.location.reload();
  }

}
