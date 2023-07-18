import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { Auth0Service } from 'src/app/shared/services/auth0.service';
import { Router } from '@angular/router';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
  selector: 'app-lector-success',
  templateUrl: './lector-success.component.html',
  styleUrls: ['./lector-success.component.css']
})
export class LectorSuccessComponent implements OnInit {

  dataSede: any;
  listReglas: any;
  numMesa = 0;
  usLog: any;
  showComercioAbierto = true;

  constructor(
    private crudService: CrudHttpService,
    private verifyClientService: VerifyAuthClientService,
    public auth: Auth0Service,
    private router: Router,
    private establecimientoService: EstablecimientoService,
    private socketService: SocketService,
  ) { }

  ngOnInit() {
    this.loadDataIni();

    // cerramos socket para que cargue carta nuevamente
    if ( this.socketService.isSocketOpen ) {
      this.socketService.closeConnection();
    }
  }

  private loadDataIni(): void {
    // datos sede
    // console.log('aaaaaa');
    this.usLog = this.verifyClientService.getDataClient();
    const _data = {
      idsede: this.usLog.idsede
    };
    

    this.numMesa = this.usLog.numMesaLector;

    this.crudService.postFree(_data, 'ini', 'info-sede', false)
      .subscribe((res: any) => {
        this.dataSede = res.data[0];

        // datos para registrar luego de loguear
        // si existe usuario en el local storage actualiza nada mas sede e idorg
        // let dataTpm = JSON.parse(window.localStorage.getItem('sys::tpm'));
        this.verifyClientService.getDataClient();
        this.verifyClientService.setIdOrg(this.dataSede.idorg);
        this.verifyClientService.setIdSede(this.dataSede.idsede);

        this.showComercioAbierto = true;

        if ( this.usLog.isDelivery ) {
          this.showComercioAbierto = this.dataSede.pwa_delivery_comercio_online === 1;
        }


        // setea el establecimiento
        this.establecimientoService.loadEstablecimientoById(this.dataSede.idsede);

        // if ( !dataTpm ) {
        //   dataTpm = {
        //     idorg: this.dataSede.idorg,
        //     idsede: this.dataSede.idsede
        //   };
        // } else {
        //   dataTpm.idorg = this.dataSede.idorg;
        //   dataTpm.idsede = this.dataSede.idsede;
        // }

        // window.localStorage.setItem('sys::tpm', JSON.stringify(dataTpm));


        // reglas del app
        this.crudService.getAll('ini', 'reglas-app', false, false, false)
          .subscribe((resp: any) => {
            this.listReglas = resp.data.map((x: any) => {
              x.descripcion = x.descripcion.replace('?', this.dataSede.pwa_time_limit);
              return x;
            });

          });
      });

  }

  listoEmpezar(): void {


    if (this.auth.loggedIn || this.verifyClientService.getIsLoginByDNI()) {
      this.router.navigate(['/callback-auth']);
    } else {
      // this.auth.login();

      // si viene del chatbot // ya esta registrado      
      if (this.usLog.isUserFromBot ) { 
        this.router.navigate(['/callback-auth']);       
        return;
      } 



      // si escanea el codigo y no esta registrado entonces va como invitado
      // y luego le pide sus datos que // telfono y nombre para delivery y nombre para mesa
      if ( this.usLog.isQrSuccess ) {        
        this.goAutoRegisterByInvitado();
        return;
      }

      this.router.navigate(['/login-client']);
    }
  }

  private goAutoRegisterByInvitado() {
    this.verifyClientService.autoRegisterLoginByInvitado();

    setTimeout(() => {
      this.router.navigate(['/callback-auth']);
    }, 500);
  }


  goZonaDelivery() {
    this.router.navigate(['/zona-delivery/establecimientos']);
  }


}
