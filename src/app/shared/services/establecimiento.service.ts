import { Injectable } from '@angular/core';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { CrudHttpService } from './crud-http.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { Observable } from 'rxjs';
import { IS_NATIVE } from '../config/config.const';

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

  setCostoSercioDelivery(val: number) {
    this.establecimiento = this.get();
    this.establecimiento.costo_total_servicio_delivery = val;
    this.set(this.establecimiento);
  }

  setImpresoras(val: any) {
    this.establecimiento = this.get();
    this.establecimiento.impresoras = val;
    this.set(this.establecimiento);
  }

  getImpresoras() {
    this.establecimiento = this.get();
    return this.establecimiento.impresoras;
  }

  getSimboloMoneda() {
    this.establecimiento = this.get();
    return this.establecimiento.simbolo_moneda;
  }


  // al iniciar el usuario
  loadEstablecimientoById(id: number) {
    const _dataSend = {
      idsede: id
    };

    // console.log('get-establecimientos _dataSend', _dataSend);

    this.crudService.postFree(_dataSend, 'delivery', 'get-establecimientos', false)
    .subscribe(res => {      
      this.establecimiento = res.data[0];
      this.set(this.establecimiento);
    });
  }

  // busca la direccion del cliente en el cache de establecimientos
  // para devolver el costo de entrega
  getFindDirClienteCacheEstableciemto(direccionCliente: DeliveryDireccionCliente, dirEstablecimiento: DeliveryEstablecimiento): DeliveryEstablecimiento {
    let _establecimientoEnCache = null;
    if ( !direccionCliente ) { return _establecimientoEnCache; } // puede que sea para consumir en el local o llevar

    let listEsblecimientosCache = <any>this.getEstableciminetosCache();
    listEsblecimientosCache = listEsblecimientosCache.filter(e => e.idcliente_pwa_direccion ===  direccionCliente.idcliente_pwa_direccion)[0];

    if ( listEsblecimientosCache ) {
      listEsblecimientosCache = listEsblecimientosCache ? listEsblecimientosCache.listEstablecimientos : [];
      _establecimientoEnCache = listEsblecimientosCache.filter(e => e.idsede === dirEstablecimiento.idsede)[0];
    }

    // console.log('establecimiento cacheado', _establecimientoEnCache);
    return _establecimientoEnCache;
  }

  getEstableciminetosCache(): any[] {
    const listEsblecimientosCache = localStorage.getItem('sys:ech');
    return listEsblecimientosCache ? JSON.parse(atob(listEsblecimientosCache)) : [];
  }

  setEstableciminetosCache(list: any) {
    // const _establecimientoCache = this.getEstableciminetosCache();
    const establecimientosCache = <any>this.getEstableciminetosCache();
    const findEstablecimiento = establecimientosCache.filter(e => e.idcliente_pwa_direccion ===  list.idcliente_pwa_direccion)[0];

    if ( findEstablecimiento ) {
      list.listEstablecimientos.map(e => {
        let isExistEstablecimiento = findEstablecimiento.listEstablecimientos.filter(x => x.idsede === e.idsede )[0];
        if ( isExistEstablecimiento ) {
          isExistEstablecimiento = e;
        } else {
          findEstablecimiento.listEstablecimientos.push(e);
        }
      });
      list.listEstablecimientos = findEstablecimiento.listEstablecimientos;
    } else {
      establecimientosCache.push(list);
    }

    localStorage.setItem('sys:ech', btoa(JSON.stringify(establecimientosCache)));
  }

  // trae las ultima comision
  getComsionEntrega() {
    const _dirEstablecimineto = this.get();
    if (_dirEstablecimineto.pwa_delivery_hablitar_calc_costo_servicio === 1) {
      const _dataSend = {
        codigo_postal: _dirEstablecimineto.codigo_postal
      };      

      this.crudService.postFree(_dataSend, 'pedido', 'get-last-comsion-entrega-sede', false)
      .subscribe(res => {
        if ( res.data.length === 0 ) { return; }
        const _data = res.data[0];
        _dirEstablecimineto.c_minimo = _data.c_minimo;
        _dirEstablecimineto.c_km = _data.c_km;
        this.set(_dirEstablecimineto);
        // console.log(res);
      });
    }
  }

  getParametrosTiendaLinea() {
    let _dirEstablecimineto = this.get();
    const _dataSend = {
      idsede: _dirEstablecimineto.idsede
    };

    this.crudService.postFree(_dataSend, 'delivery', 'get-parametros-tienda-linea', false)
    .subscribe(res => {
      // console.log('res', res);
      if ( res.data.length === 0 ) { return; }
      const _data = res.data[0];
      _dirEstablecimineto.parametros_tienda_linea = _data.parametros;
      // console.log('_dirEstablecimineto', _dirEstablecimineto);
      this.set(_dirEstablecimineto);          
      // this.set(_dirEstablecimineto);
      // console.log(res);
    });
  }


  getClienteAutocomplete(search: string): Observable<any[]> {
    const _dataSend = { buscar: search, only_sede: true };
    return new Observable(observer => {
      this.crudService.postFree(_dataSend, 'pedido', 'get-find-cliente-by-name', true)
      .subscribe((res: any) => {
        observer.next(res.data);
      });

    });
  }

  // trae los ultimos pedidos que falta calificar
  getComerciosXCalifcar(idcliente: number): Observable<any[]> {
    const _dataSend = { idcliente: idcliente };
    return new Observable(observer => {
      this.crudService.postFree(_dataSend, 'delivery', 'get-comercio-x-calificar', false)
      .subscribe((res: any) => {
        console.log('res', res);
        observer.next(res.data);
      });

    });
  }

  setRegisterScanQr(_sede: number, _canal: string, _idscan: number = 0) {
    const _dataSend = {
      idsede: _sede,
      canal: _canal,
      idscan: _idscan
    };

    this.crudService.postFree(_dataSend, 'pedido', 'register-scan', false)
      .subscribe((res: any) => {
        // console.log('register-scan',  res);
        this.setLocalIdScanQr(res.data[0].idscanqr);
      });
  }

  setLocalIdScanQr(id: number) {
    localStorage.setItem('sys::scan', id.toString());
  }

  getLocalIdScanQr(): number {
    const _id = localStorage.getItem('sys::scan') || '0';
    return parseInt(_id, 0);
  }

}
