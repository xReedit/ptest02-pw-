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

  constructor(
    private dialogRef: MatDialogRef<DialogVerificarTelefonoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private verifyClientService: VerifyAuthClientService
  ) {
    this.data = data;
   }

  ngOnInit() {
    if (!this.socketService.isSocketOpen) {
      this.infoClient = this.verifyClientService.getDataClient();
      this.socketService.connect(this.infoClient, 0, false, false);
    }


    // respuesta del msj verificacion
    this.socketService.onMsjVerificacionResponse().subscribe((res: any) => {
      // console.log('repuesta == ', res);
      if ( res.msj ) { this.intentoVerificacion = 0; } // por si quiere enviar nuevamente
      this.isNumberSuccess = res.msj ? 1 : 2;
      this.isSendSMS = true; // res.msj;
      this.isValidForm = false;
      this.isContandoShow = false;

      this.detenerContadorBtnSend();
    });
  }

  sendSMS() {

    this.isVerificacionOk = false;
    this.isSendSMS = false;
    this.isContandoShow = false;
    this.isNumberSuccess = 0;
    this.numSegundosActivarBtn = 15;

    // por wsp
    if ( this.intentoVerificacion === 0 ) {
      this.data.idsocket = this.socketService.getIdSocket();
      // console.log('msj-confirma-telefono', this.data);

      this.socketService.emit('msj-confirma-telefono', this.data);
      this.isContandoShow = true;
      this.contadorActvarBtnSend();
      return;
    }

    // console.log('enviando por msj texto');
    this.contadorActvarBtnSend();
    this.crudService.postSMS(this.data, 'delivery', 'send-sms-confirmation', true)
      .subscribe(res => {

        this.isNumberSuccess = res.msj ? 1 : 2;
        this.isSendSMS = res.msj;
        this.isValidForm = false;
        this.detenerContadorBtnSend();
      });
  }

  verificarCodigoSMS(val: string) {
    this.loader = 1;
    // this.isVerificacionOk = true;
    const _dataCod = {
      idcliente: this.data.idcliente,
      codigo: val,
      numberphone: this.data.numberphone
    };

    this.crudService.postFree(_dataCod, 'delivery', 'verificar-codigo-sms', false)
      .subscribe(res => {

        this.isVerificacionOk = res.data[0].response === 1 ? true : false;
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
    this.isValidForm = telefono.trim().length >= 5 ? true : false;
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

  cerrarDlg(): void {
    this.dialogRef.close(this.data);
  }


}

