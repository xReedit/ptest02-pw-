import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class SedeDeliveryService {

  constructor(
    private crudService: CrudHttpService
  ) { }

  loadDatosPlazaByCiudad(_ciudad: string): Observable<any[]> {
    const _dataSend = {
      ciudad: _ciudad
    };

    // console.log('_dataSend', _dataSend);

    // la plaza es opcional: quien llama tiene que poder seguir con null, y el observable
    // tiene que completarse siempre (antes se quedaba abierto y colgaba el dialogo)
    return new Observable(observer => {
      this.crudService.postFree(_dataSend, 'delivery', 'get-sede-servicio-express', false)
      .subscribe(
        (res: any) => {
          observer.next(res && res.data ? res.data[0] : null);
          observer.complete();
        },
        () => {
          observer.next(null);
          observer.complete();
        }
      );
    });

  }

  getComisionAtm(_importe: number): Observable<any[]> {
    const _dataSend = {
      importe: _importe
    };
    return new Observable(observer => {
      this.crudService.postFree(_dataSend, 'delivery', 'get-comsion-atm', false)
      .subscribe((res: any) => {
        // console.log(res);
        observer.next(res.data[0]);
      });
    });
  }
}
