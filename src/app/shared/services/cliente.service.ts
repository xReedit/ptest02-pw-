import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(
    private crudService: CrudHttpService
  ) { }

  serchClienteByDni(numdni: string): Observable<any> {
    return new Observable(observer => {
      this.crudService.getConsultaRucDni('dni', numdni)
        .subscribe((_res: any) => {
          if (_res.success) {
            observer.next( _res.data );
          } else {
            observer.next( null );
          }
        });
    });

  }

}
