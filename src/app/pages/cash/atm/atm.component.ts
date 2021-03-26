import { Component, OnInit } from '@angular/core';
import { GetFormDatosCliente } from 'src/app/modelos/GetFormDatosCliente';
import { SedeDeliveryService } from 'src/app/shared/services/sede-delivery.service';
import { Router } from '@angular/router';
import { DataTransaccion } from 'src/app/modelos/DataTransaccion';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';


@Component({
  selector: 'app-atm',
  templateUrl: './atm.component.html',
  styleUrls: ['./atm.component.css']
})
export class AtmComponent implements OnInit {

  listBilletes = [];
  importeRetirar = 0;
  stopAdd = false;
  limitAdd = 200;
  opcionesFrmCliente: GetFormDatosCliente = new GetFormDatosCliente;
  opShowPage = 0;
  enabledSendPedido = false;
  costosPlaza: any;

  private comisionAtm = 0;
  costoEntrega = 0;
  importeNetoRetirar  = 0;
  isLoadingCosto = false;

  dataAtmPago: DataTransaccion = new DataTransaccion;

  private responseFrmDatosCliente: any;

  infoClient: SocketClientModel;
  isClienteLogueado = false;

  constructor(
    private parametrosDelivery: SedeDeliveryService,
    private router: Router,
    private listenService: ListenStatusService,
    private crudService: CrudHttpService,
    private socketService: SocketService,
    private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit(): void {

    // this.infoToken.converToJSON();
    this.infoClient = this.verifyClientService.getDataClient();
    // this.isClienteLogueado = this.infoClient.isCliente;

    this.socketService.connect(this.infoClient, 0, false, true);

    // if ( this.isClienteLogueado ) {
    //   // connect socket
    // } else {
    //   this.registarDirCliente(); return;
    // }

    this.verifyBtnPagoReload();

    this.opcionesFrmCliente.showDirreccionA = true; // en realidad
    this.opcionesFrmCliente.telefono = true;
    this.opcionesFrmCliente.calDistanciaCentro = true;
    this.opcionesFrmCliente.tituloDirA = 'A dónde lo llevamos?';

    this.listBilletes.push({denominacion: 'Cien nuevos soles', valor: 100, simbolo: 'S/. ', img: 'b100.jpg'});
    this.listBilletes.push({denominacion: 'Cicuenta nuevos soles', valor: 50, simbolo: 'S/. ', img: 'b50.jpg'});

    // console.log('listBilletes', this.listBilletes);

    this.listenService.numberPageShowAtm$.subscribe(res => {
      console.log('from ATM showpage', res);
      this.opShowPage = res;
    });

  }

  verifyBtnPagoReload() {
    let localBtnP = localStorage.getItem('sys::btnP');
    localBtnP = localBtnP ? localBtnP : '';
    if ( localBtnP.toString() === '1' ) {
      localStorage.setItem('sys::btnP', '0');
      window.location.reload();
    }
  }

  resultCantItem(e) {
    console.log(this.listBilletes);

    this.importeRetirar = this.listBilletes.map(i => {
      i.cantidad_selected = i.cantidad_selected ? i.cantidad_selected : 0;
      i.importeTotal = i.cantidad_selected * i.valor;
      return i.importeTotal;
    }).reduce( (a, b) => a + b , 0 );
    console.log('this.importeRetirar', this.importeRetirar);

    this.stopAdd = this.importeRetirar >= 200;
  }

  btnNext() {
    this.opShowPage = 1;
    this.listenService.setNumberShowPageAtm(this.opShowPage);
    this.getComisionAtm();
  }

  btnBackAtm() {
    --this.opShowPage;
    this.opShowPage = this.opShowPage < 0 ? 0 : this.opShowPage;
    this.listenService.setNumberShowPageAtm(this.opShowPage);
  }

  private getComisionAtm() {
    this.parametrosDelivery.getComisionAtm(this.importeRetirar).subscribe((res: any) => {
      console.log('res comsion', res);
      this.comisionAtm = res['comision'];
    });
  }

  private calcCostoEntrega() {
    if ( !this.costosPlaza ) { return; }
    this.costoEntrega = this.costosPlaza.c_servicio + parseFloat(this.comisionAtm.toString());
    this.importeNetoRetirar = this.importeRetirar + this.costoEntrega;
    this.setDataFromAtmCash();
    // this.enabledSendPedido = true;
    // this.isLoadingCosto = false;
  }

  setDataFromAtmCash() {
    this.dataAtmPago.from = 'atm';
    this.dataAtmPago.importe = this.importeNetoRetirar;
  }

  frmClienteResponse(e: any) {
    this.isLoadingCosto = true;
    console.log('frmClienteResponse', e);

    this.responseFrmDatosCliente = e;

    this.isLoadingCosto = e.ladingCostoServicio;
    this.enabledSendPedido = !this.isLoadingCosto && e.success;

    if ( !e.ladingCostoServicio ) {
      this.costosPlaza = e.costosPlaza;
      this.calcCostoEntrega();
    }

    // if ( e.success ) {
    //   this.costosPlaza = e.costosPlaza;
    //   this.calcCostoEntrega();
    // }
  }

  nextPagar() {
    this.opShowPage = 2;
    this.listenService.setNumberShowPageAtm(this.opShowPage);
    window.scroll(0, 0);
  }

  respuestaTransaccion(e: any) {
    console.log('e response transaccion', e);
    if ( e.success ) {
      const sendData = {
          importeSolicita: this.importeRetirar,
          importeTotal: this.importeNetoRetirar,
          importeEntrega: this.costosPlaza.c_servicio,
          importeTransaccion: this.comisionAtm,
          idcliente: this.responseFrmDatosCliente.cliente.idcliente,
          billetes: this.listBilletes,
          transaccion: e.data,
          entrega : {
            cliente: {
              idcliente: this.responseFrmDatosCliente.cliente.idcliente,
              nombres: this.responseFrmDatosCliente.cliente.nombres,
              telefono: this.responseFrmDatosCliente.telefono
            },
            direccion: this.responseFrmDatosCliente.direccionA
          }
      };

      this.crudService.postFree(sendData, 'delivery', 'set-cash-atm', false)
      .subscribe(res => {
        // console.log('res save', res);
        this.socketService.emit('nuevo-retiro-cash-atm', '');
      });
    }
  }

  finTransaccionOk(e: any) {
    if (e) {
      this.router.navigate(['../']);
    } else {
      // si tuvo error y da regresar
      this.btnBackAtm();
      this.opShowPage = 0;
      this.listenService.setNumberShowPageAtm(this.opShowPage);
    }
  }


  // registarDirCliente() {
  //   this.verifyClientService.setIsDelivery(true);
  //   this.verifyClientService.setLinkRedirecLogin('./cash-atm');
  //   this.router.navigate(['/login-client']);
  // }

}
