import { Injectable } from '@angular/core';
import { InfoTockenService } from './info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from './crud-http.service';
import { SocketService } from './socket.service';
import { ClientePagoModel } from 'src/app/modelos/cliente.pago.model';

@Injectable({
  providedIn: 'root'
})
export class RegistrarPagoService {

  private infoToken: UsuarioTokenModel;
  private objTotales: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private crudService: CrudHttpService,
    private socketService: SocketService,
  ) {
    this.infoToken = this.infoTokenService.getInfoUs();
  }

  private getSubtotales(): void {
    this.objTotales = JSON.parse(atob(localStorage.getItem('sys::st')));
  }

  registrarPago(_importe: string, _dataTransactionRegister: any, dataClientePago: ClientePagoModel): void {
    this.getSubtotales();

    const _data = {
      idcliente: this.infoToken.idcliente,
      idorg: this.infoToken.idorg,
      idsede: this.infoToken.idsede,
      mesa: this.infoToken.numMesaLector,
      importe: _importe,
      objSubTotal: this.objTotales,
      objTransaction: _dataTransactionRegister,
      objCliente: dataClientePago
    };

    this.crudService.postFree(_data, 'transaction', 'registrar-pago', false).subscribe((res: any) => {
      // console.log('registro-pago', res);
      if ( res.success ) {
        this.socketService.emit('notificar-pago-pwa', _data);
      }
    });


  }

  getIpClient(): string {
    let _res = '';
    this.crudService.getFree('https://api.ipify.org?format=jsonp&callback=?').subscribe((res: any) => {
      _res = res.ip;
    });

    return _res;
  }
}
