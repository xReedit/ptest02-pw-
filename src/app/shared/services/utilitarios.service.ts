import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilitariosService {

  constructor() { }

  primeraConMayusculas(field: string): string {
    field = field.toLowerCase();
    return field.charAt(0).toUpperCase() + field.slice(1);
  }
}
