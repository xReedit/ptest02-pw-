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

    return new Observable(observer => {
      this.crudService.postFree(_dataSend, 'delivery', 'get-sede-servicio-express', false)
      .subscribe((res: any) => {
        // console.log(res);
        observer.next(res.data[0]);
      });
    });

  }
}
