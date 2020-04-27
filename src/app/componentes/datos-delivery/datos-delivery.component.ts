import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { MapsAPILoader } from '@agm/core';

@Component({
  selector: 'app-datos-delivery',
  templateUrl: './datos-delivery.component.html',
  styleUrls: ['./datos-delivery.component.css']
})
export class DatosDeliveryComponent implements OnInit {
  @ViewChild('search', {static: false}) public searchElementRef: ElementRef;

  @Output() public changeStatus = new EventEmitter<any>();

  myForm: FormGroup;
  loadConsulta = false;
  isNuevoCliente = false; // si es nuevo cliente manda a guardar

  latitude: number;
  longitude: number;
  address = '';
  dataMapa: any;
  private geoCoder;

  constructor(
    private fb: FormBuilder,
    private crudService: CrudHttpService,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    ) { }

  ngOnInit() {
    this.myForm = this.fb.group({
      idcliente: new FormControl('', [Validators.required]),
      dni: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      f_nac: new FormControl(''),
      direccion: new FormControl('', [Validators.required]),
      telefono: new FormControl('', [Validators.required]),
      paga_con: new FormControl('', [Validators.required]),
      dato_adicional: new FormControl('')
    });

    this.myForm.statusChanges.subscribe(res => {
      const isValid = res === 'VALID' ? true : false;
      const dataEmit = {
        formIsValid: isValid,
        isNuevoCliente: this.isNuevoCliente,
        formData: this.myForm.value
      };

      this.changeStatus.emit(dataEmit);
      // console.log('form delivery', dataEmit);
    });



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
          // this.zoom = 15;
        });
      });


    });
  }

  private setCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        // this.zoom = 16;
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }

  getAddress(latitude, longitude) {
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
      // console.log(results);
      // console.log(status);
      if (status === 'OK') {
        if (results[0]) {
          // this.zoom = 15;
          this.address = results[0].formatted_address;
          // this.dataCliente.direccion = this.address;
          this.dataMapa = results[0];
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

    });
  }

  buscarDNI(): void {
    const datos = {
      documento : this.myForm.controls.dni.value
    };

    this.loadConsulta = true;
    this.isNuevoCliente = false;
    this.limpiarForm(datos.documento);

    // primero consultamos en la bd
    this.crudService.postFree(datos, 'service', 'consulta-dni-ruc')
    .subscribe((res: any) => {
      // console.log(res);
      const _datosBd = res.data;
      if ( res.success && _datosBd.length > 0 ) {
        this.myForm.controls.idcliente.patchValue(_datosBd[0].idcliente);
        this.myForm.controls.nombre.patchValue(_datosBd[0].nombres);
        this.myForm.controls.f_nac.patchValue(_datosBd[0].f_nac);
        this.myForm.controls.direccion.patchValue(_datosBd[0].direccion);
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
        });

      }
    });

  }

  private limpiarForm(dni: string): void {
    this.myForm.reset();
    this.myForm.controls.dni.patchValue(dni);
  }

}
