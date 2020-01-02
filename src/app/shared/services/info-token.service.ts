import { Injectable } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { tokenName } from '@angular/compiler';


@Injectable({
  providedIn: 'root'
})
export class InfoTockenService {
  infoUsToken: UsuarioTokenModel;
  constructor( ) {
    this.converToJSON();
  }

  getInfoUs(): UsuarioTokenModel {
    return this.infoUsToken;
  }

  saveToken(token: any) {
    localStorage.setItem('::token', token);
  }

  getInfoSedeToken(): string {
    // const token = jwt.decode(this.getToken());
    return this.infoUsToken.idsede.toString();
    // return '1';
  }
  getInfoOrgToken(): string {
    return this.infoUsToken.idorg.toString();
  }

  isCliente(): boolean {
    return this.infoUsToken.isCliente;
  }

  getToken(): any { return localStorage.getItem('::token'); }

  converToJSON(): void {
    if (localStorage.getItem('::token')) {
      const _token =  JSON.parse(atob(localStorage.getItem('::token').split('.')[1]));

      // si existe idcliente, setea al usuario
      if ( _token.idcliente ) {
        const _newUs = new UsuarioTokenModel();
        _newUs.isCliente = true;
        _newUs.idcliente = _token.idcliente;
        _newUs.idorg = _token.idorg;
        _newUs.idsede = _token.idsede;
        _newUs.nombres = _token.datalogin.name;
        _newUs.idusuario = 0;
        _newUs.usuario = 'cliente';
        _newUs.numMesaLector = _token.numMesaLector;
        this.infoUsToken = _newUs;
      } else {
        this.infoUsToken = <UsuarioTokenModel>_token.usuario;
        this.infoUsToken.isCliente = false;
      }
    } else {
      this.infoUsToken = null;
    }
  }

  cerrarSession(): void {
    localStorage.removeItem('::token');
    localStorage.removeItem('sys::rules');
    localStorage.removeItem('sys::status');
    // localStorage.removeItem('sys::tpm');
  }
}
