import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { guardarTokenCliente } from 'src/app/shared/utils/token-cliente';
import { DireccionPendienteService } from 'src/app/shared/services/direccion-pendiente.service';


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
    private verifyClientService: VerifyAuthClientService,
    private direccionPendienteService: DireccionPendienteService
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
        // console.log('this.infoClient', this.infoClient);
        this.socketService.connect(this.infoClient, 0, false, false);
      }
    // }, 2000);


    // respuesta del msj verificacion
    this.socketService.onMsjVerificacionResponse().subscribe((res: any) => {
      // console.log('repuesta == ', res);
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

  // codMedio se conserva por compatibilidad de firma: hoy solo hay un medio, WhatsApp.
  sendSMS(codMedio: number) {

    this.isVerificacionOk = false;
    this.isSendSMS = false;
    this.isContandoShow = false;
    this.isNumberSuccess = 0;
    this.numSegundosActivarBtn = 15;

    // ponytail: el envio por SMS se retira. Apuntaba a delivery/send-sms-confirmation, ruta
    // que no existe (routes/v3.js la tenia comentada) y cuyo handler tenia el cuerpo entero
    // comentado: nunca respondia. El OTP real siempre fue el de WhatsApp por socket. Con eso
    // se va tambien TOKEN_SMS del bundle. Si se quiere SMS de verdad, es un sprint aparte.
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

        // console.log('x ===  verificarCodigoSMS', JSON.stringify(res));
        this.isVerificacionOk = res.data[0].response === 1 ? true : false;
        // sprint 5: con el codigo correcto el telefono queda probado -> llega el token
        if ( this.isVerificacionOk ) {
          guardarTokenCliente(res.tokenCliente);
          // ya hay identidad: la direccion escogida antes de registrarse se cuelga del cliente
          this.direccionPendienteService.sincronizar(this.data.idcliente);
        }
        // console.log('x ===  verificarCodigoSMS isVerificacionOk', this.isVerificacionOk);
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

