import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root'
})
export class ListenStatusService {

  // para activar la busqueda
  private isBusquedaSource = new BehaviorSubject<boolean>(false);
  public isBusqueda$ = this.isBusquedaSource.asObservable();

  // string a buscar
  private charBuquedaSource = new BehaviorSubject<string>('');
  public charBuqueda$ = this.charBuquedaSource.asObservable();

  // hay items en la busqueda - se encontro cuenta
  private hayCuentaBusquedaSource = new BehaviorSubject<boolean>(false);
  public hayCuentaBusqueda$ = this.hayCuentaBusquedaSource.asObservable();

  constructor() { }

  setIsBusqueda() {
    if ( !this.isBusquedaSource.value ) {
      setTimeout(() => {
        this.isBusquedaSource.next(true);
      }, 250);
    } else {
      this.isBusquedaSource.next(false);
    }
  }

  setCharBusqueda(charFind: string) {
    this.charBuquedaSource.next(charFind);
  }

  setHayCuentaBuesqueda(value: boolean): void {
    this.hayCuentaBusquedaSource.next(value);
  }
}
