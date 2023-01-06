import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { NgxMaterialTimepickerHoursFace } from 'ngx-material-timepicker/src/app/material-timepicker/components/timepicker-hours-face/ngx-material-timepicker-hours-face';
import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { Subject } from 'rxjs/internal/Subject';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { MapsServiceService } from 'src/app/shared/services/maps-service.service';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';
import { UtilitariosService } from 'src/app/shared/services/utilitarios.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';


declare var google: any;

@Component({
  selector: 'app-dialog-direccion-cliente-delivery',
  templateUrl: './dialog-direccion-cliente-delivery.component.html',
  styleUrls: ['./dialog-direccion-cliente-delivery.component.css']
})
export class DialogDireccionClienteDeliveryComponent implements OnInit, AfterViewInit {



  direccionSelected: DeliveryDireccionCliente;
  listDirecciones: DeliveryDireccionCliente[];
  idClienteDirecciones: number;
  idClienteBuscar: number;
  data: any;

  direccionBuscar: string;
  direccionBuscarUpdate = new Subject<string>();

  listPredicciones: any;
  showSelectedDireccion = true;
  showBusqueda = false;

  dataMapa: any;
  latitude: number;
  longitude: number;
  zoom: number;
  countMoveMap = 0;
  isUsCliente = true; // si el usuario es cliente o usuario autorizado
  mapCenter: any = {};
  private isChangeDireccion = true;
  isFromComercio = false;

  // nueva direccion en ingreso
  dataCliente: DeliveryDireccionCliente;
  loader = 0;

  private ciudadComercio = '';




  constructor(
    private dialogRef: MatDialogRef<DialogDireccionClienteDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
    private utilService: UtilitariosService,
    private plazaDelivery: SedeDeliveryService,
    private establecimientoService: EstablecimientoService,
    private mapsService: MapsServiceService
  ) {
    this.idClienteBuscar = data.idcliente;
    this.isFromComercio = data.isFromComercio || false;

    console.log(this.isFromComercio);

    this.direccionBuscarUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        if ( value.length > 4 ) {
          this.showBusqueda = true;
          this.getPlacesPredictionsChange(value);
        }
      });
  }

  ngOnInit(): void {
    this.dataCliente = new DeliveryDireccionCliente();
    this.loadDireccionesAgregadas();

    this.ciudadComercio = this.establecimientoService.get().ciudad;
  }

  ngAfterViewInit() {
    // this.getPlaceAutocomplete();
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

    // const rptPermissions = await this.mapsService.ubicacionRequestPermissions();
    // console.log('rptPermissions', rptPermissions);
    // this.mapsService.getPosition()

    // this.getPosition().then(pos => {
    //   console.log('pos navigater', JSON.stringify(pos));
    // })
    this.mapsService.getPosition().then((pos: any) => {
      console.log('pos', JSON.stringify(pos));
      
      this.latitude = pos.lat;
      this.longitude = pos.lng;

      this.centerChange(pos);

      this.getDireccionGeocode({ 'location': { lat: pos.lat, lng: pos.lng }});
    });
  }

  goMapa() {
    this.showSelectedDireccion = false;
  }

  getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resp => {
                resolve({lng: resp.coords.longitude, lat: resp.coords.latitude});
            },
            err => {
                reject(err);
          });
    });
}

  private async getDireccionGeocode(payload: any, prediccionSelected = null, showMapComercio = false) {

    if ( prediccionSelected ) {
      this.dataCliente.direccion = prediccionSelected.structured_formatting.main_text;
      this.dataCliente.ciudad = prediccionSelected.structured_formatting.secondary_text;
      
    }

    console.log('payload', payload);

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
          this.mapCenter.lat = this.latitude;
          this.mapCenter.lng = this.longitude;

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
      });
  }

  // mapa
  idleMap() {
    this.countMoveMap++;
  }

  centerChange(event: any) {
    // console.log('event center event', event);
    if (event) {
      this.mapCenter.lat = event.lat;
      this.mapCenter.lng = event.lng;
    }
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
    this.dataCliente.ciudad = this.searchTypeMap('locality');
    this.dataCliente.provincia = this.searchTypeMap('administrative_area_level_2');
    this.dataCliente.departamento = this.searchTypeMap('administrative_area_level_1');
    this.dataCliente.pais = this.searchTypeMap('country');
    this.dataCliente.codigo = this.searchTypeMap('postal_code');

    // console.log('this.dataCliente', this.dataCliente);
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
        this.plazaDelivery.loadDatosPlazaByCiudad(this.dataCliente.ciudad)
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
