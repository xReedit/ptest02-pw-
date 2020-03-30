import { Component, OnInit, Input } from '@angular/core';
import { PropinaModel } from 'src/app/modelos/propina.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-comp-propina-delivery',
  templateUrl: './comp-propina-delivery.component.html',
  styleUrls: ['./comp-propina-delivery.component.css']
})
export class CompPropinaDeliveryComponent implements OnInit {

  propinaSelected: PropinaModel;
  listPropina: any;
  arrTotales: any;

  _listSubtotales: any;

  @Input()
  set listSubtotales(val: any) {
    this._listSubtotales = val;
  }

  constructor(
    private infoTokenService: InfoTockenService,
  ) { }

  ngOnInit() {
    this.loadPropina();
    this.propinaSelected = this.infoTokenService.infoUsToken.propina;
  }

  private loadPropina(): void {
    this.listPropina = [];
    this.listPropina.push(<PropinaModel>{'idpropina': 1, 'value': 0 , 'descripcion': 'S/. 0', 'checked': true});
    this.listPropina.push(<PropinaModel>{'idpropina': 2, 'value': 1 , 'descripcion': 'S/. 1', 'checked': false});
    this.listPropina.push(<PropinaModel>{'idpropina': 3, 'value': 2 , 'descripcion': 'S/. 2', 'checked': false});
    this.listPropina.push(<PropinaModel>{'idpropina': 4, 'value': 3 , 'descripcion': 'S/. 3', 'checked': false});
    this.listPropina.push(<PropinaModel>{'idpropina': 5, 'value': 5 , 'descripcion': 'S/. 5', 'checked': false});

  }

  itemCheck(item: PropinaModel) {
    this.listPropina.map(x => x.checked = false);
    item.checked = true;

    // agregar a subtotales

    const rowTotal = this._listSubtotales[this._listSubtotales.length - 1];

    let rowPropina = this._listSubtotales.filter(x => x.id === -3)[0];
    if ( !rowPropina ) {
      rowPropina = {};
      rowPropina.id = -3;
      rowPropina.descripcion = 'Propina';
      rowPropina.esImpuesto = 0;
      rowPropina.visible = false;
      rowPropina.quitar = false;
      rowPropina.tachado = false;
      rowPropina.visible_cpe = false;
      rowPropina.importe = parseFloat(item.value.toString()).toFixed(2);

      this._listSubtotales.pop();
      this._listSubtotales.push(rowPropina);

      rowTotal.importe = this.getTotalSubtotales();
      this._listSubtotales.push(rowTotal);
    } else {
      rowPropina.importe = parseFloat(item.value.toString()).toFixed(2);
      rowTotal.importe = this.getTotalSubtotales();
    }

    // agregar al local
    localStorage.setItem('sys::st', btoa(JSON.stringify(this._listSubtotales)));

    this.infoTokenService.setPropina(item);
  }

  // optienen el importe total despues de agregrar la propina
  private getTotalSubtotales(): any {
    return this._listSubtotales.filter(x => x.descripcion !== 'TOTAL').map((x: any) => parseFloat(x.importe)).reduce((a, b) => a + b, 0);
  }

}
