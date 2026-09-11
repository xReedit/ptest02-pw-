import { Component, OnInit, NgZone, ViewChild, ElementRef, Output, EventEmitter, Input, AfterViewInit } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { GeolocationService } from 'src/app/shared/services/geolocation.service';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';

declare var google: any;

const CENTRO_LIMA = { lat: -12.0464, lng: -77.0428 };

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
  msjGeolocalizacion = '';
  mapsListo = false; // sin Maps no se instancia <google-map>: su ngOnInit crea google.maps.Map

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
    private establecimientoService: EstablecimientoService,
    private geolocationService: GeolocationService,
    private mapsLoader: GoogleMapsLoaderService
  ) { }

  ngOnInit() {
    this.dataCliente = new DeliveryDireccionCliente();
    this.inforTokenService.getInfoUs();
    this.isUsCliente = this.inforTokenService.getInfoUs().isCliente;
    this.loadForm();
  }

  ngAfterViewInit(): void {
    this.setCurrentLocation();

    // el geocodificador y el autocompletado necesitan el script de Maps: se arman cuando responde
    this.mapsLoader.load()
      .then(() => { this.mapsListo = this.mapsLoader.isLoaded(); })
      .catch(() => { this.mapsListo = false; })
      .then(() => this.loadInitComponent());
  }

  private loadInitComponent() {
    if (!this.mapsListo) {
      this.msjGeolocalizacion = 'El buscador de direcciones no está disponible. Escribe la dirección completa o usa las coordenadas.';
      return;
    }

    this.geoCoder = new google.maps.Geocoder();

    // el input del buscador desaparece cuando el cliente marca "ingresar en coordenadas"
    if (!this.searchElementRef) { return; }

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
      this.mapCenter = { lat: Number(this.latitude), lng: Number(this.longitude) };
      return;
    }

    this.usarCentroDeRespaldo();

    this.geolocationService.obtenerPosicion()
      .then(pos => {
        this.msjGeolocalizacion = '';
        this.latitude = pos.latitude;
        this.longitude = pos.longitude;
        this.mapCenter = { lat: pos.latitude, lng: pos.longitude };
        this.getAddress(pos.latitude, pos.longitude);
      })
      .catch(error => {
        this.msjGeolocalizacion = this.geolocationService.mensaje(error);
      });
  }

  // Centro inicial mientras el GPS responde (o si nunca responde): el del comercio si se conoce.
  private usarCentroDeRespaldo() {
    const sede = this.miPedidoService.objDatosSede && this.miPedidoService.objDatosSede.datossede
      ? this.miPedidoService.objDatosSede.datossede[0]
      : null;
    const lat = Number(sede ? sede.latitude : NaN);
    const lng = Number(sede ? sede.longitude : NaN);
    const centro = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: CENTRO_LIMA.lat, lng: CENTRO_LIMA.lng };

    this.mapCenter = centro;
    this.latitude = centro.lat;
    this.longitude = centro.lng;
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
    if (!this.geoCoder) { return; }

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

    // statusChanges dispara este metodo apenas el formulario es valido; si el GPS
    // fue denegado y aun no hay centro ni geocodificacion, no hay nada que guardar.
    if (!this.mapCenter || !this.mapCenter.lat) {
      return;
    }

    if (!this.dataMapa) {
      // sin Maps no hay geocodificacion, pero el centro de respaldo si sirve: se guarda la
      // direccion que escribio el cliente con esas coordenadas en vez de dejarla sin punto
      this.dataCliente.idcliente = this.isUsCliente ? this.verifyClientService.getDataClient().idcliente : this.idClienteBuscar;
      this.dataCliente.longitude = this.mapCenter.lng;
      this.dataCliente.latitude = this.mapCenter.lat;
      this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
      return;
    }

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
    if (!this.dataMapa || !this.dataMapa.address_components) { return rpt; }
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
    // this.map = map;
  }

  public markerClicked = (markerObj) => {
    // if (this.map && this.map.googleMap) {
    //   this.map.googleMap.setCenter({ lat: markerObj.latitude, lng: markerObj.longitude });
    // }
  }

  idleMap() {
    this.countMoveMap++;
  }

  // (centerChanged) de <google-map> no trae payload: el centro se lee del mapa.
  centerChanged(): void {
    const centro = this.map ? this.map.getCenter() : null;
    if (!centro) { return; }
    this.mapCenter = { lat: centro.lat(), lng: centro.lng() };
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
