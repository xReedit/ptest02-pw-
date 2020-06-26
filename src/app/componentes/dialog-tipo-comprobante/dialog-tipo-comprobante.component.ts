import { Component, OnInit } from '@angular/core';
import { TipoComprobanteModel } from 'src/app/modelos/tipo.comprobante.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-tipo-comprobante',
  templateUrl: './dialog-tipo-comprobante.component.html',
  styleUrls: ['./dialog-tipo-comprobante.component.css']
})
export class DialogTipoComprobanteComponent implements OnInit {

  listTipoComprobante: any;
  datosComprobante = {
    dni: '',
    otro: ''
  };

  private itemSelected: TipoComprobanteModel;
  constructor(
    private dialogRef: MatDialogRef<DialogTipoComprobanteComponent>,
    private infoTokenService: InfoTockenService,
  ) { }

  ngOnInit() {
    this.loadTipoComprobante();
    this.itemSelected = this.infoTokenService.infoUsToken.tipoComprobante;
    this.datosComprobante.dni = this.itemSelected.dni;
    this.datosComprobante.otro = this.itemSelected.otro_dato;

    this.verificarComprobanteInit();
  }

  private loadTipoComprobante() {
    this.listTipoComprobante = [];

    this.listTipoComprobante.push(<TipoComprobanteModel>{'idtipo_comprobante': 1, 'descripcion': 'Boleta', 'checked': true});
    this.listTipoComprobante.push(<TipoComprobanteModel>{'idtipo_comprobante': 2, 'descripcion': 'Factura', 'checked': false});
    // console.log(this.listTipoComprobante);
  }

  private verificarComprobanteInit() {
    this.listTipoComprobante.map(x => {
      x.checked = x.idtipo_comprobante === this.itemSelected.idtipo_comprobante ? true : false;
    });

  }

  chageItem(item: TipoComprobanteModel) {
    this.listTipoComprobante.map(x => x.checked = false);
    item.checked = true;
    this.itemSelected = item;
  }


  cerrarDlg(): void {
    this.itemSelected.dni = this.datosComprobante.dni;
    this.itemSelected.otro_dato = this.datosComprobante.otro;
    this.infoTokenService.setTipoComprobante( this.itemSelected );
    this.dialogRef.close(this.itemSelected);
  }

}
