import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { IS_NATIVE } from '../config/config.const';

export type ErrorGeolocalizacion = 'permiso-denegado' | 'no-disponible' | 'timeout';

export interface PosicionCliente {
  latitude: number;
  longitude: number;
}

export const OPCIONES_GEO = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000
};

const MENSAJES: { [clave in ErrorGeolocalizacion]: string } = {
  'permiso-denegado': 'No pudimos usar tu ubicación porque el permiso está desactivado. Escribe tu dirección en el buscador.',
  'no-disponible': 'No pudimos obtener tu ubicación en este momento. Escribe tu dirección en el buscador.',
  'timeout': 'Tu ubicación está tardando demasiado. Escribe tu dirección en el buscador.'
};

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  obtenerPosicion(): Promise<PosicionCliente> {
    return IS_NATIVE ? this.posicionNativa() : this.posicionWeb();
  }

  mensaje(error: any): string {
    const clave = error as ErrorGeolocalizacion;
    return MENSAJES[clave] || MENSAJES['no-disponible'];
  }

  private async posicionNativa(): Promise<PosicionCliente> {
    let permisos: any = null;

    try {
      permisos = await Geolocation.requestPermissions();
    } catch (error) {
      return Promise.reject(this.clasificar(error));
    }

    if (!permisos || permisos.location !== 'granted') {
      return Promise.reject('permiso-denegado' as ErrorGeolocalizacion);
    }

    try {
      const posicion = await Geolocation.getCurrentPosition(OPCIONES_GEO);
      return { latitude: posicion.coords.latitude, longitude: posicion.coords.longitude };
    } catch (error) {
      return Promise.reject(this.clasificar(error));
    }
  }

  private posicionWeb(): Promise<PosicionCliente> {
    return new Promise<PosicionCliente>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('no-disponible' as ErrorGeolocalizacion);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        posicion => resolve({ latitude: posicion.coords.latitude, longitude: posicion.coords.longitude }),
        error => reject(this.clasificar(error)),
        OPCIONES_GEO
      );
    });
  }

  private clasificar(error: any): ErrorGeolocalizacion {
    const codigo = error && error.code;
    if (codigo === 1) { return 'permiso-denegado'; }
    if (codigo === 3) { return 'timeout'; }

    const texto = ((error && error.message) || '').toString().toLowerCase();
    if (texto.indexOf('time') > -1) { return 'timeout'; }
    if (texto.indexOf('denied') > -1 || texto.indexOf('permission') > -1) { return 'permiso-denegado'; }

    return 'no-disponible';
  }
}
