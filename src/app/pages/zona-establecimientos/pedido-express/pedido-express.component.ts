import { Component, OnInit } from '@angular/core';
import { GetFormDatosCliente } from 'src/app/modelos/GetFormDatosCliente';
import { Router } from '@angular/router';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';

@Component({
  selector: 'app-pedido-express',
  templateUrl: './pedido-express.component.html',
  styleUrls: ['./pedido-express.component.css']
})
export class PedidoExpressComponent implements OnInit {

  isShowFinalize = false;

  datosFormUno: any;
  isFormValid = false;
  isFormValidDos = false;
  isCalculandoDistanciaA = false;
  isLoading = false;
  isEnviado = false;

  importe_pagar = 4;

  paramDatosCliente: GetFormDatosCliente = new GetFormDatosCliente;
  private datosClientePedido: any;

  infoClient: SocketClientModel;

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    private socketService: SocketService,
    private verifyClientService: VerifyAuthClientService
  ) { }

  ngOnInit(): void {

    this.infoClient = this.verifyClientService.getDataClient();
    this.socketService.connect(this.infoClient, 0, false, true);

    this.paramDatosCliente.showDirreccionA = true; // en realidad
    this.paramDatosCliente.tituloDirA = 'Lo recogemos en?';
    this.paramDatosCliente.showDirreccionB = true; // en realidad
    this.paramDatosCliente.tituloDirB = 'Lo llevamos a?';
    this.paramDatosCliente.telefono = true;
    this.paramDatosCliente.metodoPago = true;
    this.paramDatosCliente.metodoPagoAceptaTarjeta = false;
    this.paramDatosCliente.calDistanciaCentro = false;
    this.paramDatosCliente.calDistanciaAB = true;


    this.datosFormUno = {};
    this.datosFormUno.descripcion_paquete = '';

  }

  textChanged(val: any) {
    this.datosFormUno.descripcion_paquete = val;
    this.validFormUno();
  }


  getDatosCliente(obj: any) {
    // costo total
    console.log('obj', obj);
    this.isCalculandoDistanciaA = obj.ladingCostoServicio;
    this.isFormValidDos = false;
    if ( this.isCalculandoDistanciaA ) {return; }

    const _costoDelivery = obj.costosPlaza.c_servicio;
    const _costoMandado = obj.costosPlaza.options.costo_express;
    this.importe_pagar = _costoDelivery > _costoMandado ? _costoDelivery : _costoMandado;

    this.isFormValidDos = obj.success;
    this.datosClientePedido = obj;


  }

  private validFormUno() {
    this.isFormValid = this.datosFormUno.descripcion_paquete !== '';
  }

  goNext() {
    this.isShowFinalize = !this.isShowFinalize;
    this.scrollTopInit();
  }

  private scrollTopInit() {
    try {
      const divcontent = document.getElementById('contentmaster');
      divcontent.scrollTop = 0;
    } catch (error) {}
  }


  enviarPedidoLoQ() {

    // try {
      this.isLoading = true;
      this.isEnviado = false;
      this.datosFormUno.importe_pagar = this.importe_pagar;
      this.datosFormUno.idcliente = this.datosClientePedido.cliente.idcliente;
      this.datosFormUno.direccionA = this.datosClientePedido.direccionA;
      this.datosFormUno.direccionB = this.datosClientePedido.direccionB;
      this.datosFormUno.metodoPago = this.datosClientePedido.metodoPago;
      this.datosFormUno.ciudad = this.datosClientePedido.costosPlaza.ciudad;
      this.datosFormUno.tiempoEntrega = '';
      this.datosFormUno.distancia_km = this.datosClientePedido.costosPlaza.distancia_km;
      this.datosFormUno.distancia_mt = this.datosClientePedido.costosPlaza.distancia_mt;
      this.datosFormUno.systemOS = this.datosClientePedido.systemOS;
      this.datosFormUno.is_express = 1;
      this.datosFormUno.telefono = this.datosClientePedido.telefono;

    // } catch (error) {
    //   console.log(error);
    // }

    const _dataSend = {
      dataInfo: this.datosFormUno
    };

    this.crudService.postFree(_dataSend, 'delivery', 'set-pedido-mandado', false)
    .subscribe(res => {

      this.socketService.emit('nuevo-pedido-mandado', '');

      setTimeout(() => {
        this.isLoading = false;
        this.isEnviado = true;
      }, 1500);
    });

  }

  goZona() {
    this.router.navigate(['./zona-delivery/establecimientos']);
  }

}
