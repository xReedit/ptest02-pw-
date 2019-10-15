import { Injectable } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';


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

  getToken(): any { return localStorage.getItem('::token'); }

  private converToJSON() {
    if (localStorage.getItem('::token')) {
      const _token =  JSON.parse(atob(localStorage.getItem('::token').split('.')[1]));
      this.infoUsToken = <UsuarioTokenModel>_token.usuario;
    } else {
      this.infoUsToken = null;
    }
  }
}
