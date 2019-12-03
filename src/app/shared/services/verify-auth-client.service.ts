import { Injectable } from '@angular/core';
import { Auth0Service } from './auth0.service';
import { CrudHttpService } from './crud-http.service';
// import { Subject } from 'rxjs/internal/Subject';
// import { Observable } from 'rxjs/internal/Observable';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';

@Injectable({
  providedIn: 'root'
})
export class VerifyAuthClientService {

  public clientSocket: SocketClientModel;
  private subjectClient = new Subject<any>();

  // private subjectClientSource = new BehaviorSubject<any>(null);
  // public subjectClient$ = this.subjectClientSource.asObservable();

  constructor(
    private auth: Auth0Service,
    private crudService: CrudHttpService
  ) { }

  isLogin(): boolean {
    return this.auth.loggedIn;
  }

  setIdOrg(val: number): void {
    this.clientSocket.idorg = val;
    this.setDataClient();
  }

  setIdSede(val: number): void {
    this.clientSocket.idsede = val;
    this.setDataClient();
  }

  verifyClient(): Observable<any> {
    let idClient = 0;
    this.getDataClient();

    // verrifica si esta logueado
    this.auth.userProfile$.subscribe(res => {
      if ( !res ) {
        // this.clientSocket = new SocketClientModel();
        // this.setDataClient();
        // console.log(this.clientSocket);

        this.subjectClient.next(null);
      } else {

        console.log(res);
        this.clientSocket.datalogin = res;
        this.setDataClient();

        // verifica y registra el cliente en la bd
        this.crudService.postFree(this.clientSocket, 'ini', 'register-cliente-login', false).subscribe((rpt: any) => {
          console.log('idcliente', rpt);
          // login en backend
          idClient = rpt.data[0].idcliente;
          this.clientSocket.idcliente = idClient;
          this.clientSocket.nombres = this.clientSocket.datalogin.name;
          this.clientSocket.usuario = this.clientSocket.datalogin.given_name;
          this.clientSocket.isCliente = true;

          // guarda en el usuario temporal
          console.log(this.clientSocket);
          this.setDataClient();
          // window.localStorage.setItem('sys::tpm', JSON.stringify(this.clientSocket));

          this.subjectClient.next(this.clientSocket);
        });
      }


      // guarda vista demostracion para no cargar nuevamente

      //
    }, (error) => {
      console.log(error);
    }, () => { console.log('complete'); });

    return this.subjectClient.asObservable();

  }

  private setDataClient(): void {
    localStorage.setItem('sys::tpm', JSON.stringify(this.clientSocket));
  }

  getDataClient(): void {
    this.clientSocket = JSON.parse(localStorage.getItem('sys::tpm'));
  }


  loginOut(): void {
    this.auth.logout();
  }

  unsubscribeClient(): void {
    this.subjectClient.unsubscribe();
  }
}
