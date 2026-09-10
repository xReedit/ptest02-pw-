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

const ERRORES: ErrorGeolocalizacion[] = ['permiso-denegado', 'no-disponible', 'timeout'];

// El plugin nativo no respeta `timeout` (Android lo ignora desde v4 y iOS nunca lo pasa al
// CLLocationManager), asi que el limite se impone aqui. Se limpia el temporizador siempre,
// resuelva o rechace, para no dejar timers colgando.
export function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  let temporizador: any = null;

  const limite = new Promise<never>((_resolve, reject) => {
    temporizador = setTimeout(() => reject('timeout' as ErrorGeolocalizacion), ms);
  });

  return Promise.race([promesa, limite]).then(
    valor => {
      clearTimeout(temporizador);
      return valor;
    },
    error => {
      clearTimeout(temporizador);
      return Promise.reject(error);
    }
  );
}

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

    // Android 12+ permite conceder solo ubicacion aproximada: `location` llega 'denied' pero
    // `coarseLocation` llega 'granted'. Sirve igual para centrar el mapa.
    const concedido = !!permisos && (permisos.location === 'granted' || permisos.coarseLocation === 'granted');

    if (!concedido) {
      return Promise.reject('permiso-denegado' as ErrorGeolocalizacion);
    }

    try {
      const posicion = await conTimeout(Geolocation.getCurrentPosition(OPCIONES_GEO), OPCIONES_GEO.timeout);
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
    // conTimeout ya rechaza con el error tipado; no volver a clasificarlo.
    if (ERRORES.indexOf(error) > -1) { return error as ErrorGeolocalizacion; }

    const codigo = error && error.code;
    if (codigo === 1) { return 'permiso-denegado'; }
    if (codigo === 3) { return 'timeout'; }

    const texto = ((error && error.message) || '').toString().toLowerCase();
    if (texto.indexOf('timeout') > -1 || texto.indexOf('timed out') > -1) { return 'timeout'; }
    if (texto.indexOf('denied') > -1 || texto.indexOf('permission') > -1) { return 'permiso-denegado'; }

    return 'no-disponible';
  }
}
