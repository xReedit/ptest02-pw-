import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetodoPagoModel } from 'src/app/modelos/metodo.pago.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

@Component({
  selector: 'app-dialog-metodo-pago',
  templateUrl: './dialog-metodo-pago.component.html',
  styleUrls: ['./dialog-metodo-pago.component.css']
})
export class DialogMetodoPagoComponent implements OnInit {

  // dialogResponse: MetodoPagoModel;
  listMetodoPago: any;
  isMontoVisible = false;
  formValid = false;
  importeIndicado: string;
  isFromNoComercio = false; // si no viene de comercio

  private idExluir: null; // id escluir // cuando el comercio toma el pedido no puede pagar con tarjeta
  private isHabilitadoYape = true;
  isHabilitadoTarjeta = true; // comercios no afiliado no se acepta tarjeta por la comision que cobran, algunos comercios tambien pueden especificar que no desean pagos con tarjeta
  private isComercioSolidaridad = false;

  private itemSelected: MetodoPagoModel;
  private importeTotal: number;
  private importeValid = false;

  private isClientePedido  = false;

  constructor(
    private dialogRef: MatDialogRef<DialogMetodoPagoComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private infoTokenService: InfoTockenService,
    private establecimientoService: EstablecimientoService
  ) {
    this.importeTotal = parseFloat(data.importeTotalPagar);
    this.isFromNoComercio = data.isFromComercio ? false : true; // si no viene ese dato entonces viene de un coemrico
    this.idExluir = data.excluirId;
  }

  ngOnInit() {

    this.isHabilitadoYape  = this.isFromNoComercio ? true : this.establecimientoService.get().pwa_delivery_acepta_yape === 1;
    this.isHabilitadoTarjeta  = this.establecimientoService.get().pwa_delivery_acepta_tarjeta === 1;
    this.isComercioSolidaridad  = this.establecimientoService.get().pwa_delivery_comercio_solidaridad === 1;
    this.isClientePedido = this.infoTokenService.infoUsToken.isCliente;

    this.loadMetodoPago();
    this.itemSelected = this.infoTokenService.infoUsToken.metodoPago;
    this.verificarMetodoInit();
  }

  private loadMetodoPago() {
    this.listMetodoPago = [];

    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 2, 'descripcion': 'Tarjeta', 'checked': true, visible: this.isHabilitadoTarjeta, importe: ''});
    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 3, 'descripcion': 'Yape', 'checked': false, visible: this.isHabilitadoYape, importe: ''});
    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 1, 'descripcion': 'Efectivo', 'checked': false, visible: true});
    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 4, 'descripcion': 'POS', 'checked': false, visible: !this.isClientePedido, importe: ''});
    this.listMetodoPago.push(<MetodoPagoModel>{'idtipo_pago': 5, 'descripcion': 'Trasferencia', 'checked': false, visible: !this.isClientePedido, importe: ''});

    this.validaCociones();

  }

  private validaCociones(): void {
    // exlucion -- mayormente tarjeta cuando el comercio hace pedido delivery
    if ( this.idExluir ) {
      this.listMetodoPago = this.listMetodoPago.filter(m => m.idtipo_pago !== this.idExluir ).map(m => m);
    }

    // if ( !this.isHabilitadoYape ) {
    //   this.listMetodoPago = this.listMetodoPago.filter(m => m.idtipo_pago !== 3 ).map(m => m);
    // }

    // exclui metodos de pago no habilitados
    this.listMetodoPago = this.listMetodoPago.filter(m => m.visible ).map(m => m);

    // si es comercio solidario solo tarjeta
    if ( this.isComercioSolidaridad ) {
      this.listMetodoPago = this.listMetodoPago.filter(m => m.idtipo_pago === 2 ).map(m => m);
    }
  }

  private verificarMetodoInit() {
    if ( this.itemSelected.idtipo_pago === 1 ) {
      this.isMontoVisible = true;
      this.importeIndicado = this.itemSelected.importe.toString();

      this.verificarImporte(this.importeIndicado);
    }
    this.listMetodoPago.map(x => {
      x.checked = x.idtipo_pago === this.itemSelected.idtipo_pago ? true : false;
    });
    this.verificarValidForm();

  }

  chageItem(item: MetodoPagoModel) {
    this.listMetodoPago.map(x => x.checked = false);
    this.isMontoVisible = false;
    this.importeValid = false;
    this.importeIndicado = '';
    item.checked = true;
    this.itemSelected = item;

    if ( item.idtipo_pago === 1 ) {
      this.isMontoVisible = true;
    }

    this.verificarValidForm();
  }

  verificarImporte(importe: string) {
    this.importeValid = parseFloat(importe) >= this.importeTotal;
    this.importeIndicado = importe;
    this.itemSelected.importe = this.importeIndicado;
    this.verificarValidForm();
  }

  private verificarValidForm() {
    this.formValid = this.itemSelected.idtipo_pago !== 1 ? true : this.importeValid;

  }

  cerrarDlg(): void {
    this.infoTokenService.setMetodoPago( this.itemSelected );
    this.dialogRef.close(this.itemSelected);
  }

}
