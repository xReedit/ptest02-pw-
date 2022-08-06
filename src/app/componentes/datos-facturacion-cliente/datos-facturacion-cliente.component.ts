import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TipoComprobanteModel } from 'src/app/modelos/tipo.comprobante.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-datos-facturacion-cliente',
  templateUrl: './datos-facturacion-cliente.component.html',
  styleUrls: ['./datos-facturacion-cliente.component.css']
})
export class DatosFacturacionClienteComponent implements OnInit {

  private dataPostf: any;
  listTPC = [];
  comprobanteSelected: any;
  isShowNombre = true;
  labelInpuntTPC = 'DNI Ó RUC';
  isSuccessDNI = false;
  isSuccessName = false;
  msjDNI = '';


  dataFac: TipoComprobanteModel = new TipoComprobanteModel();

  constructor(
    private crudService: CrudHttpService,
    private infoTokenService: InfoTockenService,
    private dialogRef: MatDialogRef<DatosFacturacionClienteComponent>,
  ) { }

  ngOnInit(): void {

    this.dataPostf = {
      idsede: this.infoTokenService.getInfoUs().idsede
    };

    this.crudService.postFree(this.dataPostf, 'pedido', 'get-tpc-dato-facturacion', false)
      .subscribe( (res: any) => {
        if ( res.success ) {
          this.listTPC = res.data;
          this.comprobanteSelected = this.listTPC[0];

          const _tpcInfoToken = this.infoTokenService.infoUsToken.tipoComprobante;

          if ( _tpcInfoToken ) {
            if ( _tpcInfoToken.descripcion === _tpcInfoToken.descripcion.toUpperCase() ) {
              this.comprobanteSelected = this.listTPC.filter(x => x.idtipo_comprobante === _tpcInfoToken.idtipo_comprobante)[0];
              if ( this.comprobanteSelected ) {
                this.dataFac = _tpcInfoToken;
                this.changeOptionCPE();
              }
            }
          }

        }
      });

  }

  changeOptionCPE() {
    // console.log(this.comprobanteSelected);
    this.isShowNombre = this.comprobanteSelected.descripcion !== 'FACTURA';
    this.labelInpuntTPC = this.isShowNombre ? 'RUC' : 'DNI Ó RUC';
    // this.isShowNombre = !this.dataFac.dni;
  }

  changeDNI() {
    this.isShowNombre = !this.dataFac.dni;
    this.comprobarDNI();
  }

  changeName() {
    this.isSuccessName = this.dataFac.nombre ? this.dataFac.nombre.toString().length >= 5 : false;
  }

  comprobarDNI() {
    const _lengthDNI = this.dataFac.dni ? this.dataFac.dni.toString().length : '';
    if (this.comprobanteSelected.descripcion === 'BOLETA') { // si es boleta
      this.msjDNI = _lengthDNI === 8 ? 'DNI correcto' : _lengthDNI < 8 ? 'DNI incorrecto' : '';
      this.msjDNI = _lengthDNI === 11 ? 'RUC correcto' : _lengthDNI < 11 && _lengthDNI > 8 ? 'RUC incorrecto' : this.msjDNI;
    } else {
      this.msjDNI = _lengthDNI === 11 ? 'RUC correcto' : _lengthDNI < 11 ? 'RUC incorrecto' : '';
    }

    this.isSuccessDNI = this.msjDNI.indexOf('incorrecto') > -1 ? false : true;
  }

  saveFacturacion() {
    this.setDatosFacturacion();

    const _dataSend = {
      idsede: this.infoTokenService.getInfoUs().idsede,
      idcliente: this.infoTokenService.getInfoUs().idcliente,
      num_mesa: this.infoTokenService.getInfoUs().numMesaLector,
      data: this.dataFac
    };

    this.crudService.postFree(_dataSend, 'pedido', 'set-datos-facturacion-cliente', false)
      .subscribe( (res: any) => {
        this.dialogRef.close();
      });
  }


  cerrarDlg(): void {
    this.setDatosFacturacion();
    this.dialogRef.close();
  }

  private setDatosFacturacion() {
    this.dataFac.idtipo_comprobante = this.comprobanteSelected.idtipo_comprobante;
    this.dataFac.descripcion = this.comprobanteSelected.descripcion;

    console.log('this.dataFac', this.dataFac);
    this.infoTokenService.infoUsToken.tipoComprobante = this.dataFac;
  }

}
