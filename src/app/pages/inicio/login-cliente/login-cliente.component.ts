import { Component, OnInit } from '@angular/core';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { Router } from '@angular/router';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { Auth0Service } from 'src/app/shared/services/auth0.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { GetFormDatosCliente } from 'src/app/modelos/GetFormDatosCliente';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogVerificarTelefonoComponent } from 'src/app/componentes/dialog-verificar-telefono/dialog-verificar-telefono.component';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { DialogNombreClienteComponent } from 'src/app/componentes/dialog-nombre-cliente/dialog-nombre-cliente.component';


@Component({
  selector: 'app-login-cliente',
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.css']
})
export class LoginClienteComponent implements OnInit {
  loadConsulta = false;
  isViewLoginDNI = false;
  isValidDNI = false;
  isDateBirthdayValid = false;
  isListDateSelect = false;
  isPaseOk = false;
  dataCliente: any;
  dataClienteSend: SocketClientModel = new SocketClientModel();
  // opcionesFrmCliente: GetFormDatosCliente = new GetFormDatosCliente;
  msj_error = '';
  private idClienteBD = 0;

  listViewDate: any = [];
  private listDay: any = [];
  private listMotnh: any = [];
  private listYear: any = [];
  private numDocumento = '';

constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router,
    private auth: Auth0Service,
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private dialogTelefono: MatDialog,
    private dialogNombre: MatDialog,
    // private infoTokenService: InfoTockenService,
  ) { }

  ngOnInit() {
    this.dataClienteSend = this.verifyClientService.getDataClient();
    // console.log('data cliente', this.dataClienteSend);

    // console.log('this.infoTokenService.getInfoUs()', this.infoTokenService.getInfoUs());
    // cerramos socket para que cargue carta nuevamente
    if ( this.socketService.isSocketOpen ) {
      this.socketService.closeConnection();
    }

    // this.opcionesFrmCliente.telefono = true;
  }

  // goFb() {
  //   this.router.navigate(['/login-client']);
  // }

  goFb() {
    // tslint:disable-next-line:max-line-length
    this.auth.login('#', 'facebook');
    // window.open('https://m.facebook.com/login.php?skip_api_login=1&api_key=433734160901286&kid_directed_site=0&app_id=433734160901286&signed_next=1
    // &next=https%3A%2F%2Fm.facebook.com%2Fdialog%2Foauth%3Fdisplay%3Dtouch%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fdev
    // -m48s1pe2.auth0.com%252Flogin%252Fcallback%26scope%3Dpublic_profile%252Cemail%252Cuser_age_range%252Cuser_birthday%26state%3DXNLlXc5bBETMHz3ZsKjdrJN5Qg-m7tAs%26client_id%3D433734160901286%26ret%3Dlogin
    // %26fbapp_pres%3D0%26logger_id%3D0da22dc3-2e21-4512-9630-6755b932362e&cancel_url=https%3A%2F
    // %2Fdev-m48s1pe2.auth0.com%2Flogin%2Fcallback%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state
    // %3DXNLlXc5bBETMHz3ZsKjdrJN5Qg-m7tAs%23_%3D_&display=touch&locale=es_ES&pl_dbl=0&refsrc=https%3A%2F%2Fm.facebook.com%2Fdialog%2Foauth&_rdr', '_self');
  }

  goGmail() {
    // tslint:disable-next-line:max-line-length
    this.auth.login('#', 'google-oauth2');
    // window.open('https://accounts.google.com/signin/oauth/identifier?client_id=503309244000-nuq1e4aq964rumajuuuh8jrr8hqj4ggj.apps
    // .googleusercontent.com&as=Gt8_kdS94yJ8-SSNJ_FvAw&destination=https
    // %3A%2F%2Fdev-m48s1pe2.auth0.com&approval_state=!ChRYak5ZSGpadUgxXzNqb3hhcGZUehIfczJlb1h3T2JGZU1VRUZvSEdUZHlJLTJOcDdqNy1SWQ%E2%88%99AJDr988AAAAAXh3sARBYEr4oYCKCWs9U5zUn4rvw6fZ7&oauthgdpr=1&
    // xsrfsig=ChkAeAh8T3hpGUbuZ88B9xbsKFXhx8WEy7mEEg5hcHByb3ZhbF9zdGF0ZRILZGVzdGluYXRpb24SBXNvYWN1Eg9vYXV0aHJpc2t5c2NvcGU&
    // flowName=GeneralOAuthFlow', '_self');
  }

  goCelular() {

    console.log('this.dataClienteSend', this.dataClienteSend);

    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];
    _dialogConfig.data = {
      idcliente: -1,
      numberphone: ''
    };

    const dialogRefTelefono = this.dialogTelefono.open(DialogVerificarTelefonoComponent, _dialogConfig);

    dialogRefTelefono.afterClosed().subscribe((result: any) => {
      if ( result.verificado ) {
        console.log('result.numberphone', result);

        if ( !result.cliente ) {
          // perdir nombre
          this.openDialogSolicitaNombre(result.numberphone);
        } else {
          this.dataCliente =  result.cliente;

          this.verifyClientService.clientSocket.idcliente = this.dataCliente.idcliente;
          this.verifyClientService.clientSocket.datalogin = {
            name: result.cliente.nombres,
            given_name: result.cliente.nombres.split(' ')[0]
          };

          this.loginByTelefono();

        }
      }
    });

  }

  private openDialogSolicitaNombre(telefono: string) {
    const _dialogConfig = new MatDialogConfig();
    _dialogConfig.disableClose = true;
    _dialogConfig.hasBackdrop = true;
    _dialogConfig.panelClass = ['my-dialog-orden-detalle', 'my-dialog-scrool'];

    const dialogNombre = this.dialogNombre.open(DialogNombreClienteComponent, _dialogConfig);
    dialogNombre.afterClosed().subscribe((result: string) => {
      // this.dataCliente = {};
      // this.dataCliente.idcliente = -1;
      // this.dataCliente.nombres = result;
      // this.dataCliente.sub = `phone|${telefono}`;
      // this.dataCliente.telefono = telefono;

      this.verifyClientService.clientSocket.idcliente = -1;
      this.verifyClientService.clientSocket.telefono = telefono;
      this.verifyClientService.clientSocket.datalogin = {
        name: result,
        given_name: result.split(' ')[0],
        sub: `phone|${telefono}`
      };

      this.loginByTelefono();
    });
  }

  viewLoginDni(): void {
    this.isViewLoginDNI = !this.isViewLoginDNI;
  }

  viewLoginInvitado(): void {
    this.loginByInvitado();
  }

  buscarDNI(value: string) {
    // console.log('aaaaaaaaaaaaaaaaaaa');
    if ( value.length < 8 || this.numDocumento === value ) { return; }

    this.isValidDNI = false;
    this.isListDateSelect = false;

    this.limpiarFrm();

    this.numDocumento = value;



    this.loadConsulta = true;
    // buscamos cliente en bd
    const _dataClienteNum = {
      documento: this.numDocumento
    };


    this.crudService.postFree(_dataClienteNum, 'service', 'consulta-dni-ruc-no-tk', false)
    .subscribe((res: any) => {
      // console.log('consulta-dni', res);
      const _datosBd = res.data;
      if ( res.success && _datosBd.length > 0 ) {
        this.idClienteBD = _datosBd[0].idcliente;

        let num_verificador = _datosBd[0].dni_num_verificador;
        num_verificador = isNaN(parseInt(num_verificador, 0)) ? null : num_verificador;
        num_verificador = num_verificador === null ? _datosBd[0]?.pwa_data_session?.verification_code : num_verificador;
        num_verificador = isNaN(parseInt(num_verificador, 0)) ? null : num_verificador;

        if ( !!num_verificador === true ) {

          _datosBd[0].dni_num_verificador = num_verificador;
          this.loadConsulta = false;
          this.isValidDNI = true;
          this.dataCliente =  _datosBd[0];
          this.dataCliente.verification_code = parseInt(_datosBd[0].dni_num_verificador, 0);
          this.dataCliente.date_of_birthday = this.dataCliente.f_nac;
          this.dataCliente.number = this.numDocumento;
          this.dataCliente.names = this.dataCliente.nombres;
          this.dataCliente.name = this.dataCliente.nombres;
          this.dataCliente.sub = `dni|${this.numDocumento}`;
          // console.log(response);
          this.getListDatesCode();
          return;
        }
      }


      // console.log('continue con api');
      this.crudService.getConsultaRucDni('dni', this.numDocumento)
      .subscribe(
        (response) => {
            if ( !response.success ) {
              this.loadConsulta = false;
              this.isValidDNI = false;
              this.msj_error = 'Numero de documento no valido. Ó intente registrarse con Gmail o Facebook';
              return;
            }

            this.loadConsulta = false;
            this.isValidDNI = true;
            this.dataCliente =  response.data;
            this.dataCliente.idcliente = this.idClienteBD;
            // console.log(response);
            this.getListDatesCode();
          },
        (error) => {
            this.loadConsulta = false;
            this.isValidDNI = false;
            this.msj_error = 'No se encontro, intentelo nuevamente. Ó intente registrarse con Gmail o Facebook';
            // alert(error.message);
            // console.log(error.message);
          }
      );

    });

  }

  private limpiarFrm(): void {
    this.listViewDate = [];
    this.listDay = [];
    this.listMotnh = [];
    this.listYear = [];
    this.isValidDNI = false;
    this.numDocumento = '';
    this.msj_error = '';
  }

  private getListDatesCode(): void {
    this.listViewDate = [];
    let lista = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    lista = lista.sort(function() {return Math.random() - 0.5; });
    lista = lista.slice(0, 4);
    const isOk = lista.filter(x => x === this.dataCliente.verification_code)[0];
    if ( !isOk ) {
      const _i = this.getRandomArbitrary(0, 3);
      lista[_i] = this.dataCliente.verification_code;
     }

    this.listViewDate = lista;
    // console.log(lista);
  }

  private getListDates(): void {
    const listDate = this.dataCliente.date_of_birthday.split('/');

    this.listViewDate = [];
    this.listDay = [];
    this.listMotnh = [];
    this.listYear = [];

    this.addListDate(this.listDay, listDate[0], 'dd');
    this.addListDate(this.listMotnh, listDate[1], 'mm');
    this.addListDate(this.listYear, listDate[2], 'yy');

    // console.log('listDay', this.listDay);
    // console.log('listMotnh', this.listMotnh);
    // console.log('listYear', this.listYear);

    // year
    let contador = 0;
    let _date = '';
    this.listViewDate.push({'fecha': this.dataCliente.date_of_birthday, selected: false});
    while (contador < 3) {
      _date = `${this.listDay[this.getRandomArbitrary(0, 2)]}/${this.listMotnh[this.getRandomArbitrary(0, 2)]}/${this.listYear[this.getRandomArbitrary(0, 2)]}`;
      this.listViewDate.push({'fecha': _date, selected: false});
      contador++;
    }

    this.listViewDate.sort(function(a, b) {return 0.5 - Math.random(); } );
    this.listViewDate.sort(function(a, b) {return 0.5 - Math.random(); } );

    // console.log('listViewDate', this.listViewDate);

  }

  private addListDate(list: any, _num: string, tipo: string): void {
    const num = parseInt(_num.toString(), 0);
    let numRamond = 0;
    list.push(this.ceroIzq(num));

    numRamond =  this.getRandomArbitrary(1, 4);

    let numAdd = this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond;
    numAdd = numAdd === num ? this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond : numAdd;

    list.push(this.ceroIzq(this.verificarNum(numAdd, tipo)));

    numRamond = this.getRandomArbitrary(1, 4);
    let numAdd2 = this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond;
    numAdd2 = numAdd === numAdd2 ? this.getRandomArbitrary(0, 20) < 10 ? num + numRamond : num - numRamond : numAdd2;
    list.push(this.ceroIzq(this.verificarNum(numAdd2, tipo)));

    list.sort((a, b) => a + b);
  }

  private ceroIzq(num: number): string {
    return num < 10 ? '0' + num.toString() : num.toString();
  }

  private verificarNum(num: number, tipo: string): number {
    let rpt = num;
    switch (tipo) {
      case 'dd':
        rpt = num <= 0 || num > 31 ? this.getRandomArbitrary(1, 28) : num;
        break;
      case 'mm':
        rpt = num <= 0 || num > 12 ? this.getRandomArbitrary(1, 12) : num;
        break;
    }

    return rpt;
  }

  private getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  verificarDNI(item: any): void {
    // this.listViewDate.map( (x: any) => x.selected = false);
    // item.selected = true;

    this.isListDateSelect = true;
    // this.isDateBirthdayValid = item.fecha === this.dataCliente.date_of_birthday;

    try {

      const _pwa_data_session = this.dataCliente.pwa_data_session;
      const _pwa_data_usuario = this.dataCliente.pwa_data_usuario;

      _pwa_data_session.pwa_data_session = null;
      _pwa_data_usuario.datalogin = null;

      this.dataCliente.pwa_data_session = _pwa_data_session;
      this.dataCliente.pwa_data_usuario = _pwa_data_usuario;
    } catch (error) {
      console.log(error);
    }




    this.isDateBirthdayValid = item === this.dataCliente.verification_code;

    this.isPaseOk = this.isDateBirthdayValid;

    if (this.isPaseOk) {
      // const _name = this.dataCliente.names.indexOf(this.dataCliente.first_name) > -1 ? this.dataCliente.names + ' ' + this.dataCliente.first_name + ' ' + this.dataCliente.last_name : this.dataCliente.names;
      this.dataCliente.last_name = this.dataCliente.last_name ? this.dataCliente.last_name : '';
      this.dataCliente.first_name = this.dataCliente.first_name ? this.dataCliente.first_name : '';
      const _name = this.dataCliente.name + ' ' + this.dataCliente.first_name + ' ' + this.dataCliente.last_name;
      // if ( !this.verifyClientService.clientSocket.datalogin ) {
        this.verifyClientService.clientSocket.datalogin = this.verifyClientService.clientSocket.datalogin ? this.verifyClientService.clientSocket.datalogin : this.dataCliente;
        this.verifyClientService.clientSocket.datalogin.sub = this.verifyClientService.clientSocket.datalogin.sub ? this.verifyClientService.clientSocket.datalogin.sub : 'dni|' + this.dataCliente.number;
        this.verifyClientService.clientSocket.datalogin.name = this.verifyClientService.clientSocket.datalogin.name ? this.verifyClientService.clientSocket.datalogin.name : this.dataCliente.first_name ? _name : this.dataCliente.name;
        this.verifyClientService.clientSocket.datalogin.given_name = this.verifyClientService.clientSocket.datalogin.given_name ? this.verifyClientService.clientSocket.datalogin.given_name :
          this.dataCliente.name ? this.dataCliente.name.indexOf(' ') > 0 ? this.dataCliente.name.split(' ')[0] : this.dataCliente.name : this.dataCliente.name;
      // }
      this.verifyClientService.clientSocket.idcliente = this.dataCliente.idcliente;
      this.verifyClientService.setDataClient();
      this.verifyClientService.setIsLoginByDNI(true);
      this.auth.loggedIn = true;
      setTimeout(() => {
        this.router.navigate(['/callback-auth']);
      }, 1700);
    } else {
      this.limpiarFrm();
    }


    // console.log(item);
  }

  loginByInvitado() {
    this.verifyClientService.clientSocket.datalogin = {
      name: 'Invitado',
      given_name: 'Invitado'
    };
    this.verifyClientService.setIsLoginByDNI(false);
    this.verifyClientService.setIsLoginByTelefono(false);
    this.verifyClientService.setIsLoginByInvitado(true);
    this.verifyClientService.registerInvitado();
    setTimeout(() => {
      this.router.navigate(['/callback-auth']);
    }, 500);
  }

  loginByTelefono() {
    // this.verifyClientService.clientSocket.datalogin = {
    //   name: cliente.nombres,
    //   given_name: cliente.nombres.split(' ')[0],
    // };

    // this.verifyClientService.setIsLoginByDNI(false);
    // this.verifyClientService.setIsLoginByInvitado(false);
    // this.verifyClientService.setIsLoginByTelefono(true);

    // if ( isregistrar ) {
    //   this.verifyClientService.registerInvitado();
    // }

    // setTimeout(() => {
    //   this.router.navigate(['/callback-auth']);
    // }, 500);



    this.verifyClientService.setIsLoginByDNI(false);
    this.verifyClientService.setIsLoginByInvitado(false);
    this.verifyClientService.setIsLoginByTelefono(true);
    this.verifyClientService.registerInvitado();
    setTimeout(() => {
      this.router.navigate(['/callback-auth']);
    }, 500);

  }
}
