import { Injectable } from '@angular/core';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';


@Injectable({
  providedIn: 'root'
})
export class CalcDistanciaService {
  directionsService = new google.maps.DirectionsService();
  // private directionsDisplay = new google.maps.DirectionsRenderer();

  private origin = {};
  private destination = {};


  constructor() { }


  calculateRoute(dirCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento): any {
    let c_servicio = dirEstablecimiento.c_minimo;
    const c_km = dirEstablecimiento.c_km; // costo x km adicional

    // cordenadas
    this.origin = {
      lat: dirCliente.latitude, lng: dirCliente.longitude
    };

    this.destination = {
      lat: dirEstablecimiento.latitude, lng: dirEstablecimiento.longitude
    };

    const request = {
      origin: this.origin,
      destination: this.destination,
      travelMode: google.maps.TravelMode.DRIVING
    };

    let km = 0;
    this.directionsService.route(request, (result: any, status) => {
      if (status === 'OK') {
        // this.directionsRenderer.setDirections(result);
        km = result.routes[0].legs[0].distance.value;
        dirEstablecimiento.distancia_km = (km / 1000).toFixed(2);

        km = parseInt((km / 1000).toFixed(), 0);


        if ( km > 1 ) {
          c_servicio = (( km - 1 ) * c_km) + c_servicio;
          dirEstablecimiento.c_servicio = c_servicio;
          // return c_servicio;
        }

        // console.log('km calc', km);
        // console.log(result.routes[0].legs[0]);
        // console.log('c_servicio', c_servicio);
        // console.log('dirEstablecimiento', dirEstablecimiento);
        // return c_servicio;
        // callback(c_servicio);
      }
    });

    setTimeout(() => {
      dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
    }, 500);

    dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
  }

  // regla x km adicional
  private reglaKm() {

  }
}

