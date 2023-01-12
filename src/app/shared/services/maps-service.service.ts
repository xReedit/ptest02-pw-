// trabaja con capacitor
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IS_NATIVE } from '../config/config.const';
// import { GoogleMap} from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';
import { MapsAPILoader } from '@agm/core';
import { CrudHttpService } from './crud-http.service';
// import { ViewFlags } from '@angular/compiler/src/core';

// import { Plugins } from '@capacitor/core';
// const { Geolocation } = Plugins;
@Injectable({
  providedIn: 'root'
})
export class MapsServiceService {

  apiKeyGoogle = 'AIzaSyAknWQFyVH1RpR2OAL0vRTHTapaIpfKSqo';
  constructor(
    private mapsAPILoader: MapsAPILoader,
    private crudService: CrudHttpService
    ) { }

  // Método que calcula la ruta más corta en automóvil en kilómetros
  // entre dos direcciones utilizando la API de Google Maps
  // origen = comercio
  // destino = cliente
  calcularRuta(origen: string, destino: string): Observable<number> {
    // Crear un observable que emite los resultados de la ruta
    // y se completa una vez que la solicitud a la API de Google Maps
    // ha sido completada    
    return new Observable(observerRes => {
      // Crear una instancia de DirectionsService
      let servicio = new google.maps.DirectionsService();             
      const _origen = this.parseCoordinates(origen);
      const _destino = this.parseCoordinates(destino);

      // Configurar las opciones de la solicitud
      let opciones = {
        origin: _origen,
        destination: _destino,
        travelMode: google.maps.TravelMode.DRIVING
      };

      // Realizar la solicitud a la API de Google Maps
      servicio.route(opciones, (resultados, estado) => {
        if (estado === google.maps.DirectionsStatus.OK) {
          // Si la solicitud se completó correctamente,
          // calcular la distancia en kilómetros de la ruta          
          var ruta = resultados.routes[0];
          var distancia = 0;
          for (var i = 0; i < ruta.legs.length; i++) {
            distancia += ruta.legs[i].distance.value;
          }
          distancia = distancia / 1000
          distancia = Math.round(distancia * 10) / 10

          // Emitir los resultados de la ruta
          observerRes.next(distancia);
          observerRes.complete();
        } else {
          // Si la solicitud no se completó correctamente,
          // emitir un error con el código de estado          
          observerRes.error(estado);
          
        }
      });
    });
  }

  private parseCoordinates(coordsString: string): google.maps.LatLng {
    const coords = coordsString.split(",");
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    return new google.maps.LatLng(lat, lng);
  }


  async getPosition() {
    if (IS_NATIVE) {
      return new Promise((resolve, reject) => {
        Geolocation.requestPermissions().then(async (permissions) => {
          const coordinates = await Geolocation.getCurrentPosition();          
          resolve({ lng: coordinates.coords.longitude, lat: coordinates.coords.latitude });
          },
          err => {
            reject(err);
          });        
      })
    } else {

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resp => {
          resolve({ lng: resp.coords.longitude, lat: resp.coords.latitude });
        },
          err => {
            reject(err);
          });
      });

    }
  }


  async getDireccionInversa(lat, lng) {
    const _coordenadas = `${lng},${lat}`;
    const _url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${_coordenadas}&key=${this.apiKeyGoogle}`;        

    let requestOptions = {
      'method': 'GET'      
    };

    try {
      const response = await fetch(_url, requestOptions);
      const result = await response.json();
      return {
        status: result.status,
        results: result.results
      };      
    } catch (error) {      
      return {
        status: 'FALSE',
        results: null
      }
    }     
  }
  
}
