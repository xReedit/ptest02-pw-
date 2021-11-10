import { Injectable } from '@angular/core';
import { Auth0Service } from './auth0.service';
import { CrudHttpService } from './crud-http.service';
// import { Subject } from 'rxjs/internal/Subject';
// import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { UtilitariosService } from './utilitarios.service';
// import { Router } from '@angular/router';
// import { AuthService } from './auth.service';
import { InfoTockenService } from './info-token.service';

@Injectable({
  providedIn: 'root'
})
export class VerifyAuthClientService {

  public clientSocket: SocketClientModel;
  private subjectClient = new Subject<any>();
  public isClientValid = false;
  // private subjectClientSource = new BehaviorSubject<any>(null);
  // public subjectClient$ = this.subjectClientSource.asObservable();

  constructor(
    private auth: Auth0Service,
    private crudService: CrudHttpService,
    private utilService: UtilitariosService,
    private infoToken: InfoTockenService
    // private router: Router
  ) { }

  isLogin(): boolean {
    return this.auth.loggedIn;
  }

// en el caso de que es trunco
  setLoginOn(val: boolean) {
    this.auth.loggedIn = val;
  }

  setIdOrg(val: number): void {
    this.clientSocket.idorg = val;
    this.setDataClient();
  }

  setIdSede(val: number): void {
    this.clientSocket.idsede = val;
    this.setDataClient();
  }

  setMesa(val: number): void {
    this.clientSocket.numMesaLector = val;
    this.setDataClient();
  }

  setIsSoloLLevar(val: boolean): void {
    this.clientSocket.isSoloLLevar = val;
    this.setDataClient();
  }

  setQrSuccess(val: boolean): void {
    this.clientSocket.isQrSuccess = val;
    this.setDataClient();
  }

  setIsDelivery(val: boolean): void {
    this.clientSocket.isDelivery = val;
    this.setDataClient();
  }

  setIsReserva(val: boolean): void {
    this.clientSocket.isReserva = val;
    this.setDataClient();
  }

  setIsRetiroCash(val: boolean): void {
    this.clientSocket.isRetiroCash = val;
    this.setDataClient();
  }

  setDireccionDeliverySelected(val: DeliveryDireccionCliente): void {
    this.clientSocket.direccionEnvioSelected = val;
    this.setDataClient();
  }

  setIsLoginByDNI(val: boolean): void {
    this.clientSocket.isLoginByDNI = val;
    this.setDataClient();
  }

  setIsLoginByInvitado(val: boolean): void {
    this.clientSocket.isLoginByInvitado = val;
    this.setDataClient();
  }

  setIsLoginByTelefono(val: boolean): void {
    this.clientSocket.isLoginByTelefono = val;
    this.setDataClient();
  }

  setTelefono(val: string) {
    this.clientSocket.telefono = val;
    this.setDataClient();
  }

  getIsLoginByDNI(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isLoginByDNI || false;
  }

  getIsQrSuccess(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isQrSuccess || false;
  }


  getIsDelivery(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isDelivery || false;
  }

  getIsReserva(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isReserva || false;
  }

  getIsRetiroCash(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isRetiroCash || false;
  }

  verifyClient(): Observable<any> {
    return new Observable(observer => {

    let _dataClientReurn = null;
    const _infoTokenIsUsuarioAutorizado = this.infoToken.isUsuarioAutorizado();
    // console.log('_infoTokenIsUsuarioAutorizado', _infoTokenIsUsuarioAutorizado);

    // let resObservable = null;
    this.getDataClient();

    if ( _infoTokenIsUsuarioAutorizado ) {
      observer.next(this.clientSocket);
      return;
    }


    // if ( this.clientSocket.idcliente ) {

      // this.clientSocket.isCliente = true;
      // this.setDataClient();
    // }

    // resObservable = this.clientSocket;
    // verrifica si esta logueado
    if ( this.clientSocket?.isLoginByDNI || this.clientSocket?.isLoginByTelefono ) {
      // verifica y registra el cliente en la bd

      this.registerCliente();
      _dataClientReurn = this.clientSocket;
      // this.subjectClient.asObservable();
      // this.subjectClient.complete();
      // return this.subjectClient.asObservable();
      setTimeout(() => {
        observer.next(_dataClientReurn);
      }, 200);
      return;
    }

    // setTimeout(() => {
      this.auth.userProfile$.subscribe(resp => {
        if ( !resp ) {
          // this.clientSocket = new SocketClientModel();
          // this.setDataClient();

          if (!this.clientSocket.datalogin) {
            // this.subjectClient.thrownError = true;
            // this.subjectClient.hasError = true;
            // this.errorShowVersion('login null');
            // throw this.subjectClient.asObservable();

            // this.subjectClient.hasError = true;
            // this.subjectClient.complete();
            // this.subjectClient.next(null);
            // resObservable = null;
            // this.clientSocket = null;
            // observer.next(null);
            _dataClientReurn = null;
            observer.next(_dataClientReurn);
            // return;
            // return this.subjectClient.asObservable();
            // this.exitNotLoguerValido();
            // this.returnClientNull();
          } else {
            // this.clientSocket.datalogin = res;
            // if ( this.clientSocket.idcliente ) {
              this.clientSocket.isCliente = true;
            // }
            this.setDataClient();

            // verifica y registra el cliente en la bd
            this.registerCliente();

            _dataClientReurn = this.clientSocket;

            // console.log('aaaaa');
            setTimeout(() => {
              observer.next(_dataClientReurn);
            }, 500);
          }

        } else {

          this.clientSocket.datalogin = resp;
          // if ( this.clientSocket.idcliente ) {
            this.clientSocket.isCliente = true;
          // }
          this.setDataClient();

          // verifica y registra el cliente en la bd
          this.registerCliente();

          _dataClientReurn = this.clientSocket;

          setTimeout(() => {
            observer.next(_dataClientReurn);
          }, 500);
          // console.log('bbbb');
          // observer.next(_dataClientReurn);
          // observer.next(this.clientSocket);
          // resObservable = this.clientSocket;
        }


        // guarda vista demostracion para no cargar nuevamente

        //
      }, (error) => {
        console.log(error);
      }, () => { console.log('complete aaaaaaaaaaaaaaa'); });

      // this.subjectClient.next(this.clientSocket);
      // this.subjectClient.complete();
      // return this.subjectClient.asObservable();
      // setTimeout(() => {
        // observer.next(_dataClientReurn);
      // }, 200);
    // }, 1000);


    });
  }

  registerInvitado() {
    this.registerCliente();
  }

  // private returnClientNull() {
  //   this.subjectClient.next(null);
  // }

  private registerCliente(): void {
    let idClient = 0;
    this.clientSocket.systemOS = this.utilService.getOS();
    this.crudService.postFree(this.clientSocket, 'ini', 'register-cliente-login', false).subscribe((rpt: any) => {

      // login en backend
      idClient = rpt.data[0].idcliente;
      const nombres = rpt.data[0].nombres;
      localStorage.setItem('sys::idinv', idClient.toString()); // guarda el idivitado}

      this.clientSocket.idcliente = idClient;

      if ( this.clientSocket.isLoginByInvitado ) {
        this.clientSocket.datalogin.name = nombres;
        this.clientSocket.datalogin.given_name = nombres.split(' ')[0];
      }
      this.clientSocket.nombres = this.clientSocket.datalogin.name;
      this.clientSocket.usuario = this.clientSocket.datalogin.given_name;

      this.clientSocket.isCliente = true;
      this.clientSocket.telefono = rpt.data[0].telefono;

      // console.log('this.clientSocke', this.clientSocket);

      // guarda en el usuario temporal

      this.setDataClient();
      // window.localStorage.setItem('sys::tpm', JSON.stringify(this.clientSocket));

      this.subjectClient.next(this.clientSocket);
    });
  }

  setDataClient(): void {
    const dataClie = JSON.stringify(this.clientSocket);
    localStorage.setItem('sys::tpm', btoa(dataClie));
  }

  setLinkRedirecLogin(_link: string) {
    localStorage.setItem('sys::lrl', _link);
  }

  // link de redireccionamiento despues del login
  getLinkRedirecLogin() {
    let _link = localStorage.getItem('sys::lrl');
    _link = _link ? _link : '';
    return _link;
  }

  getDataClient(): SocketClientModel {
    const dataClie = localStorage.getItem('sys::tpm');
    if ( !dataClie ) { this.clientSocket = new SocketClientModel(); } else {
      try {
        this.clientSocket = JSON.parse(atob(dataClie));
      } catch (error) {
        if ( this.clientSocket ) {
          if ( !this.clientSocket.datalogin ) {
            this.clientSocket = new SocketClientModel();
          }
        } else {
          this.clientSocket = new SocketClientModel();
        }
      }
    }
    return this.clientSocket;
  }

  autoRegisterLoginByInvitado() {
    this.clientSocket.datalogin = {
      name: 'Invitado',
      given_name: 'Invitado'
    };

    const _idInvitadoStorage = localStorage.getItem('sys::idinv'); // guarda el idivitado}
    this.clientSocket.idcliente = _idInvitadoStorage ? parseInt(_idInvitadoStorage, 0) : 0;

    this.setIsLoginByDNI(false);
    this.setIsLoginByTelefono(false);
    this.setIsLoginByInvitado(true);
    this.registerInvitado();

  }


  loginOut(): void {
    if ( !this.clientSocket.isLoginByInvitado ) {
      this.auth.logout();
    }
    localStorage.removeItem('sys::tpm');
  }

  unsubscribeClient(): void {
    this.subjectClient.unsubscribe();
  }

  // exitNotLoguerValido() {
  //   this.loginOut();
  //   localStorage.clear();
  //   this.router.navigate(['../']);
  // }


}
