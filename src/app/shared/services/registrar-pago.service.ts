import { Injectable } from '@angular/core';
import { InfoTockenService } from './info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from './crud-http.service';
import { SocketService } from './socket.service';

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

  registrarPago(_importe: string): void {
    this.getSubtotales();

    const _data = {
      idcliente: this.infoToken.idcliente,
      idorg: this.infoToken.idorg,
      idsede: this.infoToken.idsede,
      importe: _importe,
      objSubTotal: this.objTotales
    };

    this.crudService.postFree(_data, 'transaction', 'registrar-pago', false).subscribe((res: any) => {
      console.log('registro-pago', res);
      if ( res.success ) {
        this.socketService.emit('notificar-pago-pwa', null);
      }
    });


  }
}
