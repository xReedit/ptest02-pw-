import { Injectable } from '@angular/core';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import {
  insideCircle, distanceTo
} from 'geolocation-utils';

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
    let c_servicio = 0;
    // si tiene repartidores propios y no esta suscrito al servicio de calcular distancia
    if ( dirEstablecimiento.pwa_delivery_servicio_propio === 1 && dirEstablecimiento.pwa_delivery_hablitar_calc_costo_servicio === 0) {
      c_servicio = 0;
    } else {

      c_servicio = dirEstablecimiento.c_minimo;

      const c_km = dirEstablecimiento.c_km; // costo x km adicional


      dirEstablecimiento.latitude = typeof dirEstablecimiento.latitude === 'string' ? parseFloat(dirEstablecimiento.latitude) : dirEstablecimiento.latitude;
      dirEstablecimiento.longitude = typeof dirEstablecimiento.longitude === 'string' ? parseFloat(dirEstablecimiento.longitude) : dirEstablecimiento.longitude;

      // no google
      // calculamos la distancia - return metros
      let km = 0;
      const distanciaMetros = distanceTo({lat: dirCliente.latitude, lon: dirCliente.longitude}, {lat: dirEstablecimiento.latitude, lon: dirEstablecimiento.longitude});
      const inKm = distanciaMetros / 1000;
      dirEstablecimiento.distancia_km = (inKm).toFixed(2);

      km = Math.ceil(inKm);

      console.log('establecimeinto', dirEstablecimiento.nombre);
      console.log('km distancia', km);
      console.log('metros distancia', distanciaMetros);

      if ( km > 1 ) {
        // const kmAddicionales = km / 0.5
        const kmMenos = km > 2 ? 0 : 1; // si es mayor a 2 no resta
        c_servicio = (( km - kmMenos ) * c_km) + c_servicio;
        dirEstablecimiento.c_servicio = c_servicio;

        console.log('c_servicio', c_servicio);
        // return c_servicio;
      }

      // // con google // //
      //  // cordenadas
      //  this.origin = {
      //   lat: dirCliente.latitude, lng: dirCliente.longitude
      // };

      // // console.log('this.origin', this.origin);

      // this.destination = {
      //   lat: dirEstablecimiento.latitude, lng: dirEstablecimiento.longitude
      // };

      // const request = {
      //   origin: this.origin,
      //   destination: this.destination,
      //   travelMode: google.maps.TravelMode.DRIVING
      // };

      // let km = 0;
      // this.directionsService.route(request, (result: any, status) => {
      //   if (status === 'OK') {
      //     // this.directionsRenderer.setDirections(result);
      //     km = result.routes[0].legs[0].distance.value;
      //     dirEstablecimiento.distancia_km = (km / 1000).toFixed(2);

      //     km = parseInt((km / 1000).toFixed(), 0);

      //     if ( km > 2 ) {
      //       c_servicio = (( km - 1 ) * c_km) + c_servicio;
      //       dirEstablecimiento.c_servicio = c_servicio;
      //       // return c_servicio;
      //     }

      //     // console.log('km calc', km);
      //     // console.log(result.routes[0].legs[0]);
      //     // console.log('c_servicio', c_servicio);
      //     // console.log('dirEstablecimiento', dirEstablecimiento);
      //     // return c_servicio;
      //     // callback(c_servicio);
      //   }
      // });

    }


    // // con google // //
    // setTimeout(() => {
    //   dirEstablecimiento.c_servicio = c_servicio;
    //   return c_servicio;
    // }, 500);

    dirEstablecimiento.c_servicio = c_servicio;
    return c_servicio;
  }

  // regla x km adicional
  private reglaKm() {

  }


  // retorna true si esta cerca
  calcDistancia(coordOrigen: GeoPositionModel, coordDetino: GeoPositionModel): boolean {
    const center = {lat: coordDetino.latitude, lon: coordDetino.longitude };
    const radius = 75; // meters
    return insideCircle({lat: coordOrigen.latitude, lon: coordOrigen.longitude}, center, radius);  // false
  }
}

