import { Injectable } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';



@Injectable({
  providedIn: 'root'
})
export class InfoTockenService {
  infoUsToken: UsuarioTokenModel;
  constructor(
    // private miPedidoService: MipedidoService,
  ) {
    this.converToJSON();
  }

  getInfoUs(): UsuarioTokenModel {
    this.getLocalIpCliente();
    return this.infoUsToken;
  }

  saveToken(token: any) {
    localStorage.setItem('::token', token);

    // guardo tambien la hora que esta iniciando session
    const ms_tieme_init_session = new Date().getTime();
    localStorage.setItem('sys::numtis', ms_tieme_init_session.toString());
  }

  getInfoSedeToken(): string {
    // const token = jwt.decode(this.getToken());
    return this.infoUsToken.idsede.toString();
    // return '1';
  }
  getInfoOrgToken(): string {
    return this.infoUsToken.idorg.toString();
  }

  getInfoNomSede(): string {
    return localStorage.getItem('sys::s');
  }

  isCliente(): boolean {
    return this.infoUsToken.isCliente;
  }

  isSoloLlevar(): boolean {
    return this.infoUsToken.isSoloLLevar;
  }

  getLocalIpCliente(): string {
    this.infoUsToken.ipCliente = localStorage.getItem('sys::it');
    return this.infoUsToken.ipCliente;
  }

  setLocalIpCliente(val: string): void {
    localStorage.setItem('sys::it', val);
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
        _newUs.isSoloLLevar = _token.isSoloLLevar;
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
    localStorage.removeItem('sys::numtis');
    // localStorage.removeItem('sys::tpm');
  }

  // verifica el tiempo de inactividad para cerrar session
  // cerrar session despues de 3:20 => ( 12000 sec )horas inciadas
  verificarContunuarSession(): boolean {
    if (!this.infoUsToken.isCliente) { // si es usuario autorizado no cuenta tiempo
      return true;
    }
    const numTis = parseInt(localStorage.getItem('sys::numtis'), 0);
    let continueSession = !isNaN(numTis);

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    const ms_now = new Date().getTime();
    const ms = ms_now - numTis;
    const sec = Math.floor((ms / 1000));

    if ( sec > 10000 ) {
      continueSession = false;
    }

    if (!continueSession) {
      this.cerrarSession();
      // this.miPedidoService.cerrarSession();
      return continueSession;
    }

    return true;
    // const timeAfter = localStorage.getItem('sys::tnum') ? parseInt(localStorage.getItem('sys::tnum'), 0) : ms_new;
  }
}
