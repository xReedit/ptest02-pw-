import { Injectable } from '@angular/core';
import {ClipboardModule, Clipboard} from '@angular/cdk/clipboard';

@Injectable({
  providedIn: 'root',
})
export class UtilitariosService {

  constructor(
    private clipboard: Clipboard
  ) { }

  primeraConMayusculas(field: string): string {
    field = field.toLowerCase();
    return field.charAt(0).toUpperCase() + field.slice(1);
  }

  reformatDate(dateStr: string): string {
    const dArr = dateStr.split('-');  // ex input "2010-01-18"
    return dArr[2] + '/' + dArr[1] + '/' + dArr[0]; // ex out: "18/01/10"
  }

  // optione el sistema operativo del cliente
  getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }

    return os;
  }

  // remplazar caracteres especiales por ''
  addslashes(_string: string): string {
    if ( !_string ) {return; }
    return _string.replace(/\\/g, '').
        replace(/\u0008/g, '\\b').
        replace(/\t/g, '').
        replace(/\n/g, '').
        replace(/\f/g, '').
        replace(/\r/g, '').
        replace(/'/g, '').
        replace(/"/g, '');
  }

  // compartir data titulo y url
  sharedNative(urlCartaVirtual: string , nomSede: string): any {
    // verificar si es telfono
    const _oSUs = this.getOS();
    if ( _oSUs === 'Windows' ||  _oSUs === 'Mac OS') {
      this.clipboard.copy(urlCartaVirtual);
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: 'Carta Virutal ' + nomSede,
        url: urlCartaVirtual
      }).then(() => {
        console.log('Thanks for sharing!');
        return {mensaje: 'Copiado'};
      })
      .catch(console.error);
    } else {
      // fallback
    }
  }
}
