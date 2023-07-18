import { Injectable } from '@angular/core';
import { Auth0Service } from './auth0.service';
import { CrudHttpService } from './crud-http.service';
// import { Subject } from 'rxjs/internal/Subject';
// import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs/internal/Subject';
import { Observable, throwError } from 'rxjs';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { UtilitariosService } from './utilitarios.service';
// import { Router } from '@angular/router';
// import { AuthService } from './auth.service';
import { InfoTockenService } from './info-token.service';
// import { shareReplay } from 'rxjs/internal/operators';
import { catchError, shareReplay, share } from 'rxjs/internal/operators';
import { IS_NATIVE, IS_PLATAFORM_IOS } from '../config/config.const';
import { AuthNativeService } from './auth-native.service';
// import { share } from 'rxjs/internal/operators/share';

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
    private infoToken: InfoTockenService,
    private authNativeService: AuthNativeService
    // private router: Router
  ) { }

  isLogin(): boolean {
    return this.authNativeService.isLoginSuccess
    // return this.auth.loggedIn;
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

  setIsClientTmp(val: boolean) {
    this.clientSocket.isClienteTmp = val;
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

  setUserIsFromBot(val: boolean) {    
    this.clientSocket.isUserFromBot = val;
    this.setDataClient();
  }

  getUserIsFromBot(): boolean {
    // this.getDataClient();
    if (!this.clientSocket) {
      this.getDataClient();
    }

    return this.clientSocket.isUserFromBot || false;
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

  getClientSocket(): SocketClientModel {
    return this.clientSocket;
  }

  verifyClient(): Observable<any> {
    return new Observable<any>(observerVerify => {
      // console.log('this.clientSocket verifyClient', this.clientSocket);
      const _infoTokenIsUsuarioAutorizado = this.infoToken.isUsuarioAutorizado();
      this.getDataClient();

      if ( _infoTokenIsUsuarioAutorizado ) {
        observerVerify.next(this.clientSocket);
        return;
      }

      this.registerCliente();
      // observerVerify.next(this.clientSocket);
      setTimeout(() => {
        observerVerify.next(this.clientSocket);
      }, 300);
    }).pipe(shareReplay(1));
  }


  // solo al loguear
  verifyClientLogin(): Observable<any> {
    return new Observable<any>(observer => {

    let _dataClientReurn = null;
    const _infoTokenIsUsuarioAutorizado = this.infoToken.isUsuarioAutorizado();
    // console.log('_infoTokenIsUsuarioAutorizado', _infoTokenIsUsuarioAutorizado);

    // let resObservable = null;
    this.getDataClient();

    if ( _infoTokenIsUsuarioAutorizado ) {
      observer.next(this.clientSocket);
      return;
    }

    // resObservable = this.clientSocket;
    // verrifica si esta logueado
    if ( this.clientSocket?.isLoginByDNI || this.clientSocket?.isLoginByTelefono ) {
      // verifica y registra el cliente en la bd

      this.registerCliente();
      _dataClientReurn = this.clientSocket;

      setTimeout(() => {
        observer.next(_dataClientReurn);
      }, 200);
      return;
    }

    // 060123
    // new verification gmail o facebook
    // get response authservice
      this.authNativeService.userAuthNative$.subscribe(async res => {        
        if (!res) {  
          await this.utilService.delay(500)
          return;}        

        this.clientSocket.datalogin = res;
        // if ( this.clientSocket.idcliente ) {
        this.clientSocket.isCliente = true;
        // console.log('this.clientSocket', this.clientSocket);
        // }
        this.setDataClient();

        // verifica y registra el cliente en la bd

        await this.registerCliente();
        

        // _dataClientReurn = this.clientSocket;

        setTimeout(() => {
        // if (res) {
          _dataClientReurn = this.clientSocket;
          observer.next(_dataClientReurn);
        // }
        }, 500);

        return;
      })

      return;




    // setTimeout(() => {
      // this.auth.getUser$();

    // si es web
    if (IS_NATIVE) {        
      this.auth.userProfile$.subscribe(resp => {
        if ( !resp ) {


          if (!this.clientSocket.datalogin) {
            _dataClientReurn = null;
            observer.next(_dataClientReurn);

          } else {
              this.clientSocket.isCliente = true;
            this.setDataClient();

            // verifica y registra el cliente en la bd
            this.registerCliente();

            _dataClientReurn = this.clientSocket;

            // console.log('aaaaa');
            setTimeout(() => {
              // console.log('responde');
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
        }


        // guarda vista demostracion para no cargar nuevamente

        //
      }, (error) => {
        console.log(error);
      }, () => { console.log('complete'); });


    } else { // si es nativo
      this.authNativeService.userAuthNative$.subscribe(res=>{
        console.log('usuario logueado ==>>>', res);

        this.clientSocket.datalogin = res;
        // if ( this.clientSocket.idcliente ) {
        this.clientSocket.isCliente = true;
        // }
        this.setDataClient();

        // verifica y registra el cliente en la bd
        this.registerCliente();

        _dataClientReurn = this.clientSocket;
      })
    }
    
    
    }).pipe(
      // shareReplay(1),
      share(),
      catchError(err => throwError(err))
    );
    // }
  }

  registerInvitado() {
    this.registerCliente();
  }

  // private returnClientNull() {
  //   this.subjectClient.next(null);
  // }

  async registerCliente() {
    if (!this.clientSocket.datalogin) {return; }
    let idClient = 0;
    // console.log('this.clientSocket', this.clientSocket);    
    this.clientSocket.systemOS = this.utilService.getOS();

    const _rptRegister =  await this.crudService.postFree(this.clientSocket, 'ini', 'register-cliente-login', false)
    
    _rptRegister.subscribe((rpt: any) => {

      // console.log('registerCliente', rpt);
      if ( !rpt.success ) {return; }

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
      this.clientSocket.usuario = IS_PLATAFORM_IOS ? this.clientSocket.datalogin.name: this.clientSocket.datalogin.given_name;

      this.clientSocket.isCliente = true;
      this.clientSocket.telefono = rpt.data[0].telefono;

      // console.log('this.clientSocke', this.clientSocket);

      // guarda en el usuario temporal

      this.setDataClient();
      // window.localStorage.setItem('sys::tpm', JSON.stringify(this.clientSocket));

      // sacamos  aver que pasa
      // this.subjectClient.next(this.clientSocket);
    });
  }

  setDataClient(): void {
    const dataClie = JSON.stringify(this.clientSocket);
    // console.log('dataClie setea', dataClie);
    localStorage.setItem('sys::tpm', btoa(dataClie));
  }

  setLinkRedirecLogin(_link: string) {
    this.clientSocket.linkRedirecLogin = _link;
    localStorage.setItem('sys::lrl', _link);
  }

  // link de redireccionamiento despues del login
  getLinkRedirecLogin() {
    let _link = localStorage.getItem('sys::lrl');
    _link = _link ? _link : this.clientSocket.linkRedirecLogin ? this.clientSocket.linkRedirecLogin : '';
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

  // viene del chatbot, obtener numero telefono y registrase
  async autoRegisterLoginByTelefonoFromBot(idChatBot: string) {
    const _dataSend = {
      id: idChatBot
    };

    let dataClienteFromBot: any

    this.crudService.postFree(_dataSend, 'delivery', 'get-cliente-telefono-chatbot', false)
    .subscribe((rpt: any) => {      
      if ( !rpt.success ) {return; }
      if ( rpt.data.length === 0 ) {return;}      


      dataClienteFromBot = rpt.data[0];
      
      const idClient = dataClienteFromBot.idcliente;
      const telefono_cliente = dataClienteFromBot.telefono;
      if (telefono_cliente === null ) {return;}


     
      this.clientSocket.isCliente = true;

      if (idClient > 0){ // buscar por id
             
        const nombres = dataClienteFromBot.nombres;
        this.clientSocket.idcliente = idClient;
        this.clientSocket.datalogin = {
          name: nombres,
          given_name: nombres=== ''? '' : nombres.split(' ')[0]
        };
        this.clientSocket.nombres = this.clientSocket.datalogin.name;
        this.clientSocket.usuario = this.clientSocket.datalogin.given_name;          
        this.clientSocket.telefono = dataClienteFromBot.telefono;
        this.setIsLoginByDNI(false);
        this.setIsLoginByTelefono(true);
        this.setIsLoginByInvitado(false);
        this.setUserIsFromBot(true);
        // this.registerInvitado();
        this.setDataClient()      
        // this.verifyClientLogin()

      } else { // busca por telefono   
        if (telefono_cliente !==null ) {          
          this.clientSocket.telefono = telefono_cliente;
          this.clientSocket.idcliente = -1;
  
          this.clientSocket.datalogin = {
            name: '',
            given_name: '',
            sub: `phone|${telefono_cliente}`
          };
  
          this.setIsLoginByDNI(false);
          this.setIsLoginByTelefono(true);
          this.setIsLoginByInvitado(false);
          this.setUserIsFromBot(true);
          this.registerInvitado();
        }
        // this.verifyClientLogin()
      }

     

      
    });
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
