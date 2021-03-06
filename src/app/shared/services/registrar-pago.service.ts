import { Injectable } from '@angular/core';
import { InfoTockenService } from './info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from './crud-http.service';
import { SocketService } from './socket.service';
import { ClientePagoModel } from 'src/app/modelos/cliente.pago.model';
import { Observable } from 'rxjs';
import { EstablecimientoService } from './establecimiento.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrarPagoService {

  private infoToken: UsuarioTokenModel;
  private objTotales: any;
  private responseTransaction: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private establecimiento: EstablecimientoService
  ) {
    this.infoToken = this.infoTokenService.getInfoUs();
  }

  private getSubtotales(): void {
    this.objTotales = JSON.parse(atob(localStorage.getItem('sys::st')));
  }

  registrarPago(_importe: string, _dataTransactionRegister: any, dataClientePago: ClientePagoModel, isDelivery: boolean = false) {
    this.getSubtotales();

    // console.log('this.establecimiento.get() from pago', this.establecimiento.get());

    const _objOperacion = {
      idcliente: this.infoToken.idcliente,
      idorg: this.establecimiento.get().idorg, // this.infoToken.idorg,
      idsede: this.establecimiento.get().idsede, // this.infoToken.idsede,
      mesa: this.infoToken.numMesaLector,
      importe: _importe
    };

    const _data = {
      idcliente: _objOperacion.idcliente,
      idorg: _objOperacion.idorg,
      idsede: _objOperacion.idsede,
      mesa: _objOperacion.mesa,
      importe: _objOperacion.importe,
      isdelivery: isDelivery,
      objSubTotal: this.objTotales,
      objTransaction: _dataTransactionRegister,
      objCliente: dataClientePago,
      objOperacion: _objOperacion
    };

    // console.log('registro pago service', _data);

    return new Observable(observer => {
      this.crudService.postFree(_data, 'transaction', 'registrar-pago', false).subscribe((res: any) => {
        // console.log('registro-pago', res);
        // if ( res.success ) {
          this.socketService.emit('notificar-pago-pwa', _data);
          // this.setIdRegistroPagoTransaction(res.data[0].idregistro_pago);
          this.setIdPwaPago(res.data[0].idregistro_pago);
          observer.next(res.data[0].idregistro_pago);
        // }
      });
    });


  }

  setIdPwaPago(id: number) {
    localStorage.setItem('sys::irp', id.toString());
  }

  getIdPwaPago(): number {
    let idPwaPago = parseInt(localStorage.getItem('sys::irp'), 0);
    idPwaPago = idPwaPago ? 0 : idPwaPago;
    localStorage.removeItem('sys::irp');
    return idPwaPago;
  }

  getIpClient(): string {
    let _res = '';
    this.crudService.getFree('https://api.ipify.org?format=jsonp&callback=?').subscribe((res: any) => {
      _res = res.ip;
    });

    return _res;
  }


  // manejo de respuesta en local storage
  getDataTrasaction(): any {
    // toma la respuesta de pago
    // this.responseTransaction = JSON.parse(localStorage.getItem('sys::transaction-response'));
    this.loadDataTransaction();
    const resPagoIsSucces = this.responseTransaction ? !this.responseTransaction.error : false;
    this.responseTransaction.isSuccess = !resPagoIsSucces;


    return this.responseTransaction;
  }

  private setIdRegistroPagoTransaction(id: number): void {
    this.loadDataTransaction();
    this.responseTransaction.idregistro_pago = id;
    this.upDataTransaction();
  }

  private loadDataTransaction(): void {
    // toma la respuesta de pago
    this.responseTransaction = JSON.parse(localStorage.getItem('sys::transaction-response'));
  }

  private upDataTransaction(): void {
    localStorage.setItem('sys::transaction-response', JSON.stringify(this.responseTransaction));
  }

  removeLocalDataTransaction(): void {
    localStorage.removeItem('sys::transaction-response');
    this.responseTransaction = null;
  }
}
