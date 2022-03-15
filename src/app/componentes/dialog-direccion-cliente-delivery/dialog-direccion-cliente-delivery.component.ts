import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInput } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs/internal/operators';
import { Subject } from 'rxjs/internal/Subject';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
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

  // nueva direccion en ingreso
  dataCliente: DeliveryDireccionCliente;
  loader = 0;




  constructor(
    private dialogRef: MatDialogRef<DialogDireccionClienteDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
    private utilService: UtilitariosService,
    private plazaDelivery: SedeDeliveryService
  ) {
    this.idClienteBuscar = data.idcliente;

    this.direccionBuscarUpdate.pipe(
      debounceTime(400),
      distinctUntilChanged())
      .subscribe(value => {
        if ( value.length > 5 ) {
          this.showBusqueda = true;
          this.getPlacesPredictionsChange(value);
        }
      });
  }

  ngOnInit(): void {
    this.dataCliente = new DeliveryDireccionCliente();
    this.loadDireccionesAgregadas();
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

    const options = {
      input: value,
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

  goDireccion(prediccionSelected: any) {
    // console.log('direccion selected', prediccionSelected);

    this.getDireccionGeocode({ placeId: prediccionSelected.place_id }, prediccionSelected);
  }

  goUbicacionActual() {
      this.getPosition().then(pos => {
      this.latitude = pos.lat;
      this.longitude = pos.lng;

      this.centerChange(pos);

      this.getDireccionGeocode({ 'location': { lat: this.mapCenter.lat, lng: this.mapCenter.lng }});
  });
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

  private getDireccionGeocode(payload: any, prediccionSelected = null) {

    if ( prediccionSelected ) {
      this.dataCliente.direccion = prediccionSelected.structured_formatting.main_text;
      this.dataCliente.ciudad = prediccionSelected.structured_formatting.secondary_text;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder
      .geocode(payload)
      .then(({ results }) => {
        // console.log('results geocoder', results);

        this.dataMapa = results[0];

        if ( !prediccionSelected ) {
          const _foramt_address = this.dataMapa.formatted_address.split(', ');
          this.dataCliente.direccion = _foramt_address[0];
          this.dataCliente.ciudad = _foramt_address[1];
        }

        this.latitude = results[0].geometry.location.lat();
        this.longitude = results[0].geometry.location.lng();
        this.zoom = 17;
        this.isChangeDireccion = false;

        // centrar
        this.mapCenter.lat = this.latitude;
        this.mapCenter.lng = this.longitude;

        this.countMoveMap = 0;

        this.showSelectedDireccion = false;

        this.setDireccionSelected();


        // setTimeout(() => {
        // }, 500);
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
        setTimeout(() => {
          this.loader = 2;
          setTimeout(() => {
            this.dataCliente.idcliente_pwa_direccion = res.data[0].idcliente_pwa_direccion;
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
