import { Injectable } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { CrudHttpService } from './crud-http.service';

@Injectable({
  providedIn: 'root'
})
export class EstablecimientoService {
  establecimiento: DeliveryEstablecimiento;

  private keyStorage = 'sys::ed';
  constructor(
    private crudService: CrudHttpService
  ) { }

  set(_establecimiento: DeliveryEstablecimiento) {
    localStorage.setItem(this.keyStorage, btoa(JSON.stringify(_establecimiento)));
  }

  get(): DeliveryEstablecimiento {
    let _establecimiento = new DeliveryEstablecimiento;
    const _isExist = localStorage.getItem(this.keyStorage);
    _establecimiento = _isExist ? <DeliveryEstablecimiento>JSON.parse(atob(_isExist)) : _establecimiento;
    return _establecimiento;
  }

  setRulesSubtotales(val: any) {
    this.establecimiento = this.get();
    this.establecimiento.rulesSubTotales = val;
    this.set(this.establecimiento);
  }


  // al iniciar el usuario
  loadEstablecimientoById(id: number) {
    const _dataSend = {
      idsede: id
    };

    this.crudService.postFree(_dataSend, 'delivery', 'get-establecimientos')
    .subscribe(res => {
      this.establecimiento = res.data[0];
      this.set(this.establecimiento);
      // console.log(res);
    });
  }
}
