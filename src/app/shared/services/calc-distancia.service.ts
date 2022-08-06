import { Injectable } from '@angular/core';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { EstablecimientoService } from './establecimiento.service';
import { GeoPositionModel } from 'src/app/modelos/geoposition.model';
import { Observable } from 'rxjs/internal/Observable';

declare var google: any;

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


  constructor(
    private estableciminetoService: EstablecimientoService
  ) { }


  // para cacular al visualizar estableciminetos
  calculateRouteNoApi(dirCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento, buscarEnCache = true): any {
      let c_servicio = 0;
      c_servicio = dirEstablecimiento.c_minimo;

      const c_km = dirEstablecimiento.c_km; // costo x km adicional


      dirEstablecimiento.latitude = typeof dirEstablecimiento.latitude === 'string' ? parseFloat(dirEstablecimiento.latitude) : dirEstablecimiento.latitude;
      dirEstablecimiento.longitude = typeof dirEstablecimiento.longitude === 'string' ? parseFloat(dirEstablecimiento.longitude) : dirEstablecimiento.longitude;

      dirCliente.latitude = typeof dirCliente.latitude === 'string' ? parseFloat(dirCliente.latitude) : dirCliente.latitude;
      dirCliente.longitude = typeof dirCliente.longitude === 'string' ? parseFloat(dirCliente.longitude) : dirCliente.longitude;

      let km = 0;
      const distanciaMetros = distanceTo({lat: dirEstablecimiento.latitude, lon: dirEstablecimiento.longitude}, {lat: dirCliente.latitude, lon: dirCliente.longitude});
      const inKm = distanciaMetros / 1000;
      dirEstablecimiento.distancia_mt = distanciaMetros.toString();
      dirEstablecimiento.distancia_km = (inKm).toFixed(2);

      km = Math.ceil(inKm);

      c_servicio = this.calCostoDistancia(dirEstablecimiento, inKm);

      // console.log('establecimeinto', dirEstablecimiento.nombre);
      // console.log('km distancia', km);
      // console.log('metros distancia', distanciaMetros);

      // if ( km > 1 ) {
      //   // const kmAddicionales = km / 0.5
      //   const kmMenos = km > 2 ? 0 : 1; // si es mayor a 2 no resta
      //   c_servicio = (( km - kmMenos ) * c_km) + c_servicio;
      //   dirEstablecimiento.c_servicio = c_servicio;

      //   // console.log('c_servicio', c_servicio);
      //   // return c_servicio;
      // }

      dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
  }


  calculateRoute(dirCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento, buscarEnCache: boolean = true): any {
    // console.log('calcular google');
    // return new Observable(observer => {
        let c_servicio = 0;
      // si tiene repartidores propios y no esta suscrito al servicio de calcular distancia
      // if ( dirEstablecimiento.pwa_delivery_servicio_propio === 1 && dirEstablecimiento.pwa_delivery_hablitar_calc_costo_servicio === 0) {
        // c_servicio = 0;
      // } else {

        c_servicio = dirEstablecimiento.c_minimo;

        const c_km = dirEstablecimiento.c_km; // costo x km adicional


        dirEstablecimiento.latitude = typeof dirEstablecimiento.latitude === 'string' ? parseFloat(dirEstablecimiento.latitude) : dirEstablecimiento.latitude;
        dirEstablecimiento.longitude = typeof dirEstablecimiento.longitude === 'string' ? parseFloat(dirEstablecimiento.longitude) : dirEstablecimiento.longitude;

        dirCliente.latitude = typeof dirCliente.latitude === 'string' ? parseFloat(dirCliente.latitude) : dirCliente.latitude;
        dirCliente.longitude = typeof dirCliente.longitude === 'string' ? parseFloat(dirCliente.longitude) : dirCliente.longitude;

        // // no google
        // // calculamos la distancia - return metros
        // let km = 0;
        // const distanciaMetros = distanceTo({lat: dirEstablecimiento.latitude, lon: dirEstablecimiento.longitude}, {lat: dirCliente.latitude, lon: dirCliente.longitude});
        // const inKm = distanciaMetros / 1000;
        // dirEstablecimiento.distancia_km = (inKm).toFixed(2);

        // km = Math.ceil(inKm);

        // // console.log('establecimeinto', dirEstablecimiento.nombre);
        // // console.log('km distancia', km);
        // // console.log('metros distancia', distanciaMetros);

        // if ( km > 1 ) {
        //   // const kmAddicionales = km / 0.5
        //   const kmMenos = km > 2 ? 0 : 1; // si es mayor a 2 no resta
        //   c_servicio = (( km - kmMenos ) * c_km) + c_servicio;
        //   dirEstablecimiento.c_servicio = c_servicio;

        //   // console.log('c_servicio', c_servicio);
        //   // return c_servicio;
        // }


        // buscamos primero la direccion del cliente en cache
        // console.log('buscarEnCache', buscarEnCache);
        if ( buscarEnCache ) {
          const _establecimientoCacheado = <any>this.estableciminetoService.getFindDirClienteCacheEstableciemto(dirCliente, dirEstablecimiento);
          if ( _establecimientoCacheado ) {
            // console.log('from calcDistance cache', _establecimientoCacheado);

            dirEstablecimiento.distancia_km = _establecimientoCacheado.distancia_km;
            dirEstablecimiento.c_servicio = this.calCostoDistancia(dirEstablecimiento, _establecimientoCacheado.distancia_km);

            // si el costo del delivery es mayor a 15 lo vuelve a calcular
            if ( dirEstablecimiento.c_servicio <= 15 ) {
              return dirEstablecimiento.c_servicio;
            }
          }
        }

        // // con google // //
        //  // cordenadas
        this.origin = {
          lat: dirCliente.latitude, lng: dirCliente.longitude
        };

        // console.log('this.origin', this.origin);

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
            const _kmReal =  km / 1000;
            dirEstablecimiento.distancia_mt = km.toString();
            dirEstablecimiento.distancia_km = (_kmReal).toFixed(2);

            dirEstablecimiento.isCalcApiGoogle = true;

            // km = parseInt((km / 1000).toFixed(), 0);

            c_servicio = this.calCostoDistancia(dirEstablecimiento, _kmReal);
            dirEstablecimiento.c_servicio = c_servicio;

            // km = Math.ceil(_kmReal); // lo redondea
            // if ( km > 2 ) {
            //   // const kmMenos = _kmReal > 1.5 ? 0 : 1; // si es mayor a 2 no resta
            //   c_servicio = (( km - 1 ) * c_km) + c_servicio;
            //   dirEstablecimiento.c_servicio = c_servicio;
            //   // return c_servicio;
            // }

            // cachear direccion establecimineto
            const listCache = [];
            listCache.push(dirEstablecimiento);

            // guardar lista en cache
            const establecimientoToCache = {
              idcliente_pwa_direccion: dirCliente.idcliente_pwa_direccion,
              listEstablecimientos: listCache
            };

            this.estableciminetoService.setEstableciminetosCache(establecimientoToCache);


            // console.log('km from calculateRoute', km);
            // console.log(result.routes[0].legs[0]);
            // console.log('c_servicio', c_servicio);
            // console.log('dirEstablecimiento', dirEstablecimiento);
            // return c_servicio;
            // callback(c_servicio);
          }
        });

      // }


      // // con google // //
      setTimeout(() => {
        dirEstablecimiento.c_servicio = c_servicio;
        return c_servicio;
      }, 500);

      dirEstablecimiento.c_servicio = c_servicio;
      return c_servicio;
    // });
  }


  calculateRouteObserver(dirCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento, buscarEnCache: boolean = true): Observable<DeliveryEstablecimiento> {
    return new Observable(observer => {
        let c_servicio = 0;

        c_servicio = dirEstablecimiento.c_minimo;

        const c_km = dirEstablecimiento.c_km; // costo x km adicional


        dirEstablecimiento.latitude = typeof dirEstablecimiento.latitude === 'string' ? parseFloat(dirEstablecimiento.latitude) : dirEstablecimiento.latitude;
        dirEstablecimiento.longitude = typeof dirEstablecimiento.longitude === 'string' ? parseFloat(dirEstablecimiento.longitude) : dirEstablecimiento.longitude;

        dirCliente.latitude = typeof dirCliente.latitude === 'string' ? parseFloat(dirCliente.latitude) : dirCliente.latitude;
        dirCliente.longitude = typeof dirCliente.longitude === 'string' ? parseFloat(dirCliente.longitude) : dirCliente.longitude;

        // if ( buscarEnCache ) {
        //   const _establecimientoCacheado = <any>this.estableciminetoService.getFindDirClienteCacheEstableciemto(dirCliente, dirEstablecimiento);
        //   if ( _establecimientoCacheado ) {
        //     // console.log('from calcDistance cache', _establecimientoCacheado);

        //     dirEstablecimiento.distancia_km = _establecimientoCacheado.distancia_km;
        //     dirEstablecimiento.c_servicio = this.calCostoDistancia(dirEstablecimiento, _establecimientoCacheado.distancia_km);
        //     // console.log('rpt a', dirEstablecimiento);
        //     observer.next(dirEstablecimiento);
        //     return;
        //   }
        // }

        // // con google // //
        //  // cordenadas
        this.origin = {
          lat: dirCliente.latitude, lng: dirCliente.longitude
        };

        // console.log('this.origin', this.origin);

        this.destination = {
          lat: dirEstablecimiento.latitude, lng: dirEstablecimiento.longitude
        };

        const request = {
          origin: this.origin,
          destination: this.destination,
          travelMode: google.maps.TravelMode.DRIVING
        };

        let km = 0;
        // console.log('calculando.. 1');
        this.directionsService.route(request, (result: any, status) => {
          if (status === 'OK') {
            // this.directionsRenderer.setDirections(result);
            // console.log('result.routes', result.routes);
            km = result.routes[0].legs[0].distance.value;
            const _kmReal =  km / 1000;
            dirEstablecimiento.distancia_mt = km.toString();
            dirEstablecimiento.distancia_km = (_kmReal).toFixed(2);

            dirEstablecimiento.isCalcApiGoogle = true;

            // km = parseInt((km / 1000).toFixed(), 0);

            c_servicio = this.calCostoDistancia(dirEstablecimiento, _kmReal);
            dirEstablecimiento.c_servicio = c_servicio;
            // console.log('calculando.. 3');

            // cachear direccion establecimineto
            // const listCache = [];
            // listCache.push(dirEstablecimiento);

            // // guardar lista en cache
            // const establecimientoToCache = {
            //   idcliente_pwa_direccion: dirCliente.idcliente_pwa_direccion,
            //   listEstablecimientos: listCache
            // };

            // this.estableciminetoService.setEstableciminetosCache(establecimientoToCache);

            console.log('calc distancia', dirEstablecimiento);
            observer.next(dirEstablecimiento);

          }
        });

    });
  }

  // distancia_km > tambien del elemento cacheado
  calCostoDistancia(dirEstablecimiento: DeliveryEstablecimiento,  distancia_km: number): number {
    // console.log('distancia_km', distancia_km);
    const km = Math.ceil(distancia_km); // lo redondea
    const c_km = parseFloat(dirEstablecimiento.c_km.toString()); // costo x km adicional // puede variar
    let c_servicio = parseFloat(dirEstablecimiento.c_minimo.toString()); // puede variar

    let menosKm = 0;
    menosKm = km > 2 ? 2 : menosKm;
    menosKm = km > 5 ? 0 : menosKm; // si es mayor o igual  a 4 kilometros entonce no resta
    if ( km > 2 ) {
      c_servicio = (( km - menosKm ) * c_km) + c_servicio;
      dirEstablecimiento.c_servicio = c_servicio;
    }

    // console.log('calculando.. ', c_servicio);

    return c_servicio;
  }

  // regla x km adicional
  // private reglaKm() {

  // }


  // retorna true si esta cerca
  calcDistancia(coordOrigen: GeoPositionModel, coordDetino: GeoPositionModel): boolean {
    const center = {lat: coordDetino.latitude, lon: coordDetino.longitude };
    const radius = 75; // meters
    return insideCircle({lat: coordOrigen.latitude, lon: coordOrigen.longitude}, center, radius);  // false
  }

  // calcula la lluvia


  // calcula la distanca del establecimiento al ingresar a la carta para asegurar lo cacula con api google
  calcCostoEntregaApiGoogleRain(direccionCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento) {

    if ( !direccionCliente ) {return; }
    // buscamos en cache
    // const _establecimientoCache = this.estableciminetoService.getFindDirClienteCacheEstableciemto(direccionCliente, dirEstablecimiento);
    const _establecimientoCache = null;
    if ( _establecimientoCache ) {
      if ( !_establecimientoCache.isCalcApiGoogle ) {

        _establecimientoCache.isCalcApiGoogle = true;
        this.calculateRoute(direccionCliente, _establecimientoCache, false);
      } else {
        this.calculateRoute(direccionCliente, dirEstablecimiento, false);
      }
    } else {
      this.calculateRouteObserver(direccionCliente, dirEstablecimiento, false).subscribe(res => {
        console.log('rpt calc', res);
      });
    }

  }


  // private setCacheDireccion(direccionCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento, costo: Number) {
  //   const c_km = parseFloat(dirEstablecimiento.c_km.toString()); // costo x km adicional // puede variar
  //   const c_servicio = parseFloat(dirEstablecimiento.c_minimo.toString()); // puede variar
  //   const coordenadas_cliente = direccionCliente.latitude + direccionCliente.longitude;
  //   const coordenadas_comercio = dirEstablecimiento.latitude + dirEstablecimiento.longitude;
  // }
}

