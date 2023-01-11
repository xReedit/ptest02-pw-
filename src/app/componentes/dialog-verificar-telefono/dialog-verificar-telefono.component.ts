import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';


@Component({
  selector: 'app-dialog-verificar-telefono',
  templateUrl: './dialog-verificar-telefono.component.html',
  styleUrls: ['./dialog-verificar-telefono.component.css']
})
export class DialogVerificarTelefonoComponent implements OnInit {

  data: any;
  isValidForm = false;
  isSendSMS = false;
  isNumberSuccess = 0;
  loader = 0;
  isVerificacionOk = false;
  infoClient: any;
  intentoVerificacion = 0;
  conteoInterval: any;
  numSegundosActivarBtn = 15;
  isContandoShow = false;
  private isClienteNoRegister = false;

  constructor(
    private dialogRef: MatDialogRef<DialogVerificarTelefonoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private verifyClientService: VerifyAuthClientService
  ) {
    this.data = data;


    // cliente aun no definido
    // busca el cliente por el numero de telefono sino lo encuentra
    // crea un registro temporal de codigo verificacion
    if ( this.data?.idcliente === -1 ) {
      this.isClienteNoRegister = true;
    }
   }

  ngOnInit() {
    // setTimeout(() => {
      if (!this.socketService.isSocketOpen) {
        this.infoClient = this.verifyClientService.getDataClient();
        console.log('this.infoClient', this.infoClient);
        this.socketService.connect(this.infoClient, 0, false, false);
      }
    // }, 2000);


    // respuesta del msj verificacion
    this.socketService.onMsjVerificacionResponse().subscribe((res: any) => {
      console.log('repuesta == ', res);
      // if ( res.msj ) { this.intentoVerificacion = 0; } // por si quiere enviar nuevamente
      this.isNumberSuccess = res.msj ? 1 : 2;
      this.isSendSMS = true; // res.msj;
      // this.isValidForm = false;
      this.isContandoShow = false;

      this.detenerContadorBtnSend();
    });
  }

  enviarCodigoSMS(codMedio: number) {
    if ( this.isClienteNoRegister ) {
      this.buscarClienteTelefono(codMedio);
      return;
    }

    this.sendSMS(codMedio);
  }

  sendWhatsApp() {

  }

  // codMedio  0 = whatsapp  1= s ms
  sendSMS(codMedio: number) {

    this.isVerificacionOk = false;
    this.isSendSMS = false;
    this.isContandoShow = false;
    this.isNumberSuccess = 0;
    this.numSegundosActivarBtn = 15;

    // por wsp
    // if ( this.intentoVerificacion === 0 ) {
    // this.intentoVerificacion = 1;
    if ( codMedio === 0 ) {
      this.data.idsocket = this.socketService.getIdSocket();

      if (!this.socketService.isSocketOpen) {
        this.socketService.connect(this.infoClient, 0, false, false);
      }


      setTimeout(() => {
        this.socketService.emit('msj-confirma-telefono', this.data);
      }, 500);
      this.isContandoShow = true;
      this.contadorActvarBtnSend();
      this.intentoVerificacion++; // reintentar
      return;
    }

    // por sms
    this.contadorActvarBtnSend();
    this.crudService.postSMS(this.data, 'delivery', 'send-sms-confirmation', false)
      .subscribe(res => {

        this.isNumberSuccess = res.msj ? 1 : 2;
        this.isSendSMS = res.msj;
        // this.isValidForm = false;
        this.detenerContadorBtnSend();
        this.intentoVerificacion++; // reintentar
      });
  }

  verificarCodigoSMS(val: string) {
    this.loader = 1;
    // this.isVerificacionOk = true;
    // idcliente -2  verifica -1 guarda codigo tmp
    const _dataCod = {
      idcliente: this.isClienteNoRegister ? -2 : this.data.idcliente,
      codigo: val,
      numberphone: this.data.numberphone
    };

    this.crudService.postFree(_dataCod, 'delivery', 'verificar-codigo-sms', false)
      .subscribe(res => {

        console.log('x ===  verificarCodigoSMS', JSON.stringify(res));
        this.isVerificacionOk = res.data[0].response === 1 ? true : false;
        console.log('x ===  verificarCodigoSMS isVerificacionOk', this.isVerificacionOk);
        setTimeout(() => {
          this.loader = this.isVerificacionOk ? 2 : 3;
          this.data.verificado = this.isVerificacionOk;
          // this.loader = 2;s

          if ( this.isVerificacionOk ) {
            setTimeout(() => {
              this.cerrarDlg();
            }, 1000);
          }
        }, 1000);
      });
  }

  verificarNum(telefono: string): void {
    this.isValidForm = telefono.trim().length >= 9 ? true : false;
    this.data.numberphone = telefono;
    this.data.verificado = false;
  }

  contadorActvarBtnSend() {
    this.isContandoShow = true;
    this.conteoInterval = setInterval(() => {
      if ( this.numSegundosActivarBtn > 0 ) {
        this.numSegundosActivarBtn--;
      } else {
        this.numSegundosActivarBtn = 15;
        this.isSendSMS = true;
        this.isContandoShow = false;
        this.intentoVerificacion = 1;
        // console.log('this.intentoVerificacion', this.intentoVerificacion);
        clearInterval(this.conteoInterval);
      }
    }, 1000);
  }

  detenerContadorBtnSend() {
    this.numSegundosActivarBtn = 15;
    this.isSendSMS = true;
    this.isContandoShow = false;
    clearInterval(this.conteoInterval);
  }


  private buscarClienteTelefono(codMedio: number) {
    const _dataSend = {
      telefono: this.data.numberphone
    };

     this.crudService.postFree(_dataSend, 'delivery', 'search-cliente-by-phone', false)
    .subscribe((res: any) => {
      // console.log('cliten con telefono', res);
      this.data.isClienteTelefono = true;
      this.data.cliente = res.data.length > 0 ? res.data[0] : null;
      if ( res.data.length > 0 ) {
        this.isClienteNoRegister = false;
        this.data.idcliente = this.data.cliente.idcliente;
      }

      this.sendSMS(codMedio);
    });
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.data);
  }


}

