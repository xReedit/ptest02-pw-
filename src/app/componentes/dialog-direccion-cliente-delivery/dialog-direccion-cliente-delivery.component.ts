import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GoogleMap } from '@angular/google-maps';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';
import { GeolocationService } from 'src/app/shared/services/geolocation.service';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';

declare var google: any;

// ponytail: misma heuristica que mapa-solo. Google no siempre invoca gm_authFailure
// (RefererNotAllowedMapError pinta su propio panel dentro del contenedor y no avisa),
// asi que si el mapa no llega a dibujar en este plazo se le da por caido.
const MS_ESPERA_MAPA = 6000;

const MSJ_SIN_MAPA = 'El mapa no está disponible. Guardaremos la dirección tal como la escribiste.';

@Component({
  selector: 'app-dialog-direccion-cliente-delivery',
  templateUrl: './dialog-direccion-cliente-delivery.component.html',
  styleUrls: ['./dialog-direccion-cliente-delivery.component.css']
})
export class DialogDireccionClienteDeliveryComponent implements OnInit, AfterViewInit, OnDestroy {

  direccionSelected: DeliveryDireccionCliente;
  listDirecciones: DeliveryDireccionCliente[];
  idClienteDirecciones: number;
  idClienteBuscar: number;

  direccionBuscar: string;
  direccionBuscarUpdate: Subject<string> = new Subject<string>();

  listPredicciones: any;
  showSelectedDireccion = true;
  showBusqueda = false;

  dataMapa: any;
  latitude: number;
  longitude: number;
  zoom = 17;
  countMoveMap = 0;
  isUsCliente = true; // si el usuario es cliente o usuario autorizado
  mapsListo = false;    // el script de Maps respondio
  mapaPintado = false;  // llego tilesloaded: el mapa se dibujo de verdad
  mapaCaido = false;    // vencio la espera o Google reporto el fallo de autenticacion
  mapCenter: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 };
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    clickableIcons: false,
    gestureHandling: 'greedy'
  };

  @ViewChild(GoogleMap) map: GoogleMap;

  private isChangeDireccion = true;
  isFromComercio = false;

  private destroy$ = new Subject<void>();
  private temporizador: any = null;
  private destruido = false;

  // nueva direccion en ingreso
  dataCliente: DeliveryDireccionCliente;
  loader = 0;
  msjGeolocalizacion = '';

  private ciudadComercio = '';




  constructor(
    public dialogRef: MatDialogRef<DialogDireccionClienteDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) private dialogData: any,
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private utilService: UtilitariosService,
    private establecimientoService: EstablecimientoService,
    private sedeDeliveryService: SedeDeliveryService,
    private geolocationService: GeolocationService,
    private mapsLoader: GoogleMapsLoaderService,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {
    this.idClienteBuscar = dialogData.idcliente;
    this.isFromComercio = dialogData.isFromComercio || false;

    this.direccionBuscarUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe((value: any) => {
        if ( value?.length > 4 ) {
          this.showBusqueda = true;
          this.getPlacesPredictionsChange(value);
        }
      });
  }

  ngOnInit(): void {
    this.dataCliente = new DeliveryDireccionCliente();
    this.loadDireccionesAgregadas();

    this.ciudadComercio = this.establecimientoService.get().ciudad;

    this.mapsLoader.load()
      .then(() => { this.mapsListo = true; })
      .catch(() => { this.mapsListo = false; });

    // BehaviorSubject: si el fallo de autenticacion ya ocurrio, la suscripcion recibe el valor actual
    this.mapsLoader.authFallida$.pipe(takeUntil(this.destroy$)).subscribe((fallida) => {
      if (fallida) { this.mapsListo = false; this.mapaCaido = true; this.mapaPintado = false; }
    });
  }

  ngAfterViewInit() {
    // this.getPlaceAutocomplete();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.limpiarEspera();
    this.destroy$.next();
    this.destroy$.complete();
  }


  private loadDireccionesAgregadas() {
    this.listDirecciones = [];
    const _dataClientDir = {
      idcliente : this.idClienteBuscar
    };

    this.crudService.postFree(_dataClientDir, 'delivery', 'get-direccion-cliente', false)
      .subscribe((res: any) => {
        const direccionGuardada = this.getDireccionStorage();

        this.listDirecciones = res.data;
        this.listDirecciones.map(d => {
          d.direccion = d.direccion.split(',')[0];
          if ( direccionGuardada ) {
            d.selected = d.idcliente_pwa_direccion === direccionGuardada.idcliente_pwa_direccion;
          }
        });

        // console.log('this.listDirecciones', this.listDirecciones);
      });
  }


  getPlacesPredictionsChange(value: string) {

    // sin Maps, tocar google.* lanza ReferenceError y mata la suscripcion de busqueda del dialogo
    if (!this.mapsLoader.isLoaded()) {
      this.msjGeolocalizacion = MSJ_SIN_MAPA;
      this.listPredicciones = [];
      return;
    }

    const sessionToken = new google.maps.places.AutocompleteSessionToken();
    // si es comercio adjunta la ciudad
    const _input = this.isFromComercio ? `${value}, ${this.ciudadComercio}` : value;

    const options = {
      input: _input,
      componentRestrictions: { country: 'pe' },
      sessionToken: sessionToken
    };

    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(options, (
      predictions: google.maps.places.QueryAutocompletePrediction[] | null,
      status: google.maps.places.PlacesServiceStatus
    ) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        // alert(status);
        return;
      }

      this.listPredicciones = predictions;
      // predictions.forEach((prediction) => {
      //   console.log('prediction.description', prediction);
      // });
    });
  }

  goDireccionGuardada(item: DeliveryDireccionCliente) {
    // console.log('item DeliveryDireccionCliente', item);
    this.dataCliente = item;
    this.cerrarDlg();
  }

  goDireccion(prediccionSelected: any, showMapComercio = false) {
    // console.log('direccion selected', prediccionSelected);
    this.getDireccionGeocode({ placeId: prediccionSelected.place_id }, prediccionSelected, showMapComercio);
  }

  async goUbicacionActual() {
    this.msjGeolocalizacion = '';

    try {
      const pos = await this.geolocationService.obtenerPosicion();
      this.latitude = pos.latitude;
      this.longitude = pos.longitude;
      this.setCentro(pos.latitude, pos.longitude);
      this.getDireccionGeocode({ location: { lat: pos.latitude, lng: pos.longitude } });
    } catch (error) {
      // Alternativa manual: se queda en el buscador de direcciones.
      this.msjGeolocalizacion = this.geolocationService.mensaje(error);
      this.showBusqueda = true;
    }
  }

  goMapa() {
    this.showSelectedDireccion = false;
  }

  private setCentro(lat: number, lng: number): void {
    this.mapCenter = { lat, lng };
  }

  private async getDireccionGeocode(payload: any, prediccionSelected = null, showMapComercio = false) {

    if ( prediccionSelected ) {
      this.dataCliente.direccion = prediccionSelected.structured_formatting.main_text;
      this.dataCliente.ciudad = prediccionSelected.structured_formatting.secondary_text;

    }

    if (!this.mapsLoader.isLoaded()) {
      this.msjGeolocalizacion = MSJ_SIN_MAPA;
      // sin geocodificacion igual hay que dejar idcliente y las coordenadas del centro de respaldo
      this.setDireccionSelected();
      this.showSelectedDireccion = false;
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder
      .geocode(payload)
      .then(({ results, status }) => {
        
      // const result = await this.mapsService.getDireccionInversa(payload.location.lat, payload.location.lng)
        // console.log('results fecth', (results));

      // if (status === google.maps.GeocoderStatus.OK) {
      // if (result.status === google.maps.GeocoderStatus.OK) { 

          // const streetName = results[0].address_components.find(component => component.types.includes('route')).long_name;
          // console.log('========> direccion cercana', streetName)
    
        // const selectedResult = results.find(result => result.types.includes('street_address') ||
        //                                               result.types.includes('route') ||
        //                                               result.types.includes('political')) || 
        //                                               results.shift();
        let selectedResult = results.find(result => result.types.includes('street_address'))
          || results.find(result => result.types.includes('route'))        
          || results.find(result => result.types.includes('political'))        
          || results.shift();

        this.dataMapa = selectedResult;

          if ( !prediccionSelected ) {
            const _foramt_address = this.dataMapa.formatted_address.split(', ');
            this.dataCliente.direccion = _foramt_address[0];
            this.dataCliente.ciudad = _foramt_address[1];
          }

          this.latitude = this.dataMapa.geometry.location.lat();
          this.longitude = this.dataMapa.geometry.location.lng();
          // this.latitude = this.dataMapa.geometry.location.lat;
          // this.longitude = this.dataMapa.geometry.location.lng;
          this.zoom = 17;
          this.isChangeDireccion = false;

          // centrar
          this.setCentro(this.latitude, this.longitude);

          this.countMoveMap = 0;

          // 110422 si viene de comercio no pasa al mapa
          if ( this.isFromComercio && !showMapComercio ) {
            this.setDireccionSelected();
            this.saveDireccion();
            return;
          }

          this.showSelectedDireccion = false;

          this.setDireccionSelected();


          // setTimeout(() => {
          // }, 500);
        // }
      })
      .catch(() => {
        // el geocodificador rechaza (clave sin permiso, sin resultados, red caida): no se pierde lo escrito
        this.msjGeolocalizacion = 'No pudimos ubicar esa dirección en el mapa. Puedes guardarla tal como la escribiste.';
        this.setDireccionSelected();
        this.showSelectedDireccion = false;
      });
  }

  // mapa
  idleMap() {
    this.countMoveMap++;
  }

  // (centerChanged) de <google-map> no trae payload: el centro se lee del mapa.
  centerChanged(): void {
    const centro = this.map ? this.map.getCenter() : null;
    if (!centro) { return; }
    this.setCentro(centro.lat(), centro.lng());
  }

  /** mapInitialized solo dice que se instancio google.maps.Map: con la clave rechazada tambien llega. */
  mapaMontado(): void { this.armarEspera(); }

  /** tilesloaded es la unica senal de que el mapa llego a dibujarse: cancela la espera. */
  mapaListo(): void {
    this.limpiarEspera();
    this.zone.run(() => { this.mapaPintado = true; this.mapaCaido = false; });
  }

  /** Sin mapa dibujado se muestra el texto de respaldo; la direccion se puede guardar igual. */
  mostrarRespaldo(): boolean {
    if (this.mapaPintado) { return false; }
    return this.mapaCaido || !this.mapsListo;
  }

  private armarEspera(): void {
    if (this.temporizador || this.mapaPintado) { return; }
    // fuera de Angular para no mantener vivo el ciclo de deteccion durante la espera
    this.zone.runOutsideAngular(() => {
      this.temporizador = setTimeout(() => {
        this.temporizador = null;
        if (this.mapaPintado || this.destruido) { return; }
        this.zone.run(() => { this.mapaCaido = true; this.cd.detectChanges(); });
      }, MS_ESPERA_MAPA);
    });
  }

  private limpiarEspera(): void {
    if (this.temporizador) { clearTimeout(this.temporizador); this.temporizador = null; }
  }

  clickmap() {
    this.isChangeDireccion = true;
  }

  setDireccionSelected() {

    // this.latitude = this.mapCenter.lat;
    // this.longitude = this.mapCenter.lng;

    // this.loader = 1;
    this.dataCliente.direccion = this.dataCliente.direccion;
    this.dataCliente.idcliente = this.isUsCliente ? this.verifyClientService.getDataClient().idcliente : this.idClienteBuscar;
    this.dataCliente.longitude = this.mapCenter.lng;
    this.dataCliente.latitude = this.mapCenter.lat;
    this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
    // sin geocodificacion searchTypeMap devuelve '': se conserva la ciudad de la prediccion,
    // que es de la que depende cerrarDlg() para buscar la plaza
    this.dataCliente.ciudad = this.searchTypeMap('locality') || this.dataCliente.ciudad;
    this.dataCliente.provincia = this.searchTypeMap('administrative_area_level_2');
    this.dataCliente.departamento = this.searchTypeMap('administrative_area_level_1');
    this.dataCliente.pais = this.searchTypeMap('country');
    this.dataCliente.codigo = this.searchTypeMap('postal_code');

    // console.log('this.dataCliente', this.dataCliente);
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

  goBackEscogerDireccion() {
    this.showSelectedDireccion  = true;
  }

  confirmarDireccion() {
    this.countMoveMap = 1;    
    this.getDireccionGeocode({ 'location': { lat: this.mapCenter.lat, lng: this.mapCenter.lng }});

    // this.getAddress(this.mapCenter.lat, this.mapCenter.lng);
  }

  saveDireccion() {
    this.loader = 1;
    this.dataCliente.titulo = this.dataCliente.titulo || 'Casa';
      this.loader = 2;
      this.dataCliente.idcliente_pwa_direccion = null;
      // this.saveDireccionOk.emit(this.dataCliente);
      this.setBdDireccion();
  }

  private setBdDireccion() {

    this.dataCliente.referencia = this.utilService.addslashes(this.dataCliente.referencia);
    this.crudService.postFree(this.dataCliente, 'cliente', 'new-direccion', false)
      .subscribe((res: any) => {
        if ( this.isFromComercio ) {
          if ( res.success ) {
            this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
          }
          this.countMoveMap = 1;
          this.cerrarDlg();

          return;
        }

        setTimeout(() => {
          this.loader = 2;
          setTimeout(() => {
            if ( res.success ) {
              this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
            }
            this.countMoveMap = 1;
            this.cerrarDlg();
          }, 500);
        }, 1000);
      });
  }

  private setDireccionStorage() {
    localStorage.setItem('sys::dir_se', JSON.stringify(this.dataCliente));
  }

  private getDireccionStorage() {
    return localStorage.getItem('sys::dir_se') ? JSON.parse(localStorage.getItem('sys::dir_se')) : null;
  }

  cerrarDlg(): void {
    // guarda direccion en el storage direccion seleccionada
    // console.log('this.dataCliente', this.dataCliente);
    const rpt_dir = this.dataCliente.direccion ? this.dataCliente : null;

    if ( rpt_dir && this.dataCliente ) {
      if ( !this.dataCliente?.options ) {
        this.sedeDeliveryService.loadDatosPlazaByCiudad(this.dataCliente.ciudad)
        .subscribe((resPlaza: any) => {
          this.dataCliente.options = resPlaza ? resPlaza.options : null;

          this.setDireccionStorage();
          this.dialogRef.close(rpt_dir);
        });
      } else {
        this.setDireccionStorage();
        this.dialogRef.close(rpt_dir);
      }
    } else {
      // const rpt_dir = this.dataCliente.direccion ? this.dataCliente : null;
      // this.dataCliente = null;
      this.setDireccionStorage();
      this.dialogRef.close(rpt_dir);
    }

  }

}
