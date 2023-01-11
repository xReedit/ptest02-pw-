// import { StringMap } from '@angular/compiler/src/compiler_facade_interface';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { CocinarPromoShowService } from 'src/app/shared/services/promo/cocinar-promo-show.service';

@Component({
  selector: 'app-item-promocion',
  templateUrl: './item-promocion.component.html',
  styleUrls: ['./item-promocion.component.css']
})
export class ItemPromocionComponent implements OnInit {

  @Input() promo: any;
  @Output() selected: EventEmitter<any> = new EventEmitter();
  ItemPromoheader: any;
  ItemPromoBody: any;
  diasActivo = '';
  isAbierto = false;
  animateBloqueo = false;
  iconGifPromo = '';
  showInfoPromo = false;
  simbolo_moneda: string;

  constructor(
    private cocinarPromocionService: CocinarPromoShowService,
    private establecimientoService: EstablecimientoService
  ) {
  }

  ngOnInit(): void {
    // console.log('promo', this.promo);
    this.isAbierto = this.promo.abierto === 1;
    this.ItemPromoheader = this.promo.parametros.header;
    this.ItemPromoBody = this.promo.parametros.body;
    this.diasActivo = this.cocinarPromocionService.showDiasSemana(this.ItemPromoBody.dias_semana);
    this.iconGifPromo = `assets/images/${this.ItemPromoheader.icon}`;

    this.isAbierto = this.promo.abierto === 1;
    this.simbolo_moneda = this.establecimientoService.getSimboloMoneda();
  }

  clickPromo() {
    // if ( this.cocinarPromocionService.consultarPromoAbierto(this.promo) ) {

    if ( this.validarIngresoPromo() ) {
      this.isAbierto = true;
      this.selected.emit(this.promo);
    }
  }

  validarIngresoPromo(): Boolean {
    let paseAbierto = false;
    let importeMinimoPromo = null;
    if ( this.promo.abierto === 1 ) {
      paseAbierto = true;
      // validamos si tiene importe minimo de consumo
      importeMinimoPromo = this.ItemPromoBody.importe_consumo_min;
      if ( importeMinimoPromo ) {
        const importePedido = this.cocinarPromocionService.getImportePedido();
        // console.log('importePedido', importePedido);
        if ( importePedido >=  importeMinimoPromo) {
          paseAbierto = true;
        } else {
          paseAbierto = false;
        }
      }
    }

    if ( !paseAbierto ) {
      this.isAbierto = false;
      this.animateBloqueo = true;
      setTimeout(() => {
        this.showInfoPromo = importeMinimoPromo && this.promo.abierto === 1 ? true : false;
        this.animateBloqueo = false;

        if ( this.showInfoPromo ) {
          setTimeout(() => {this.showInfoPromo = false; }, 6000);
        }

      }, 300);
    }

    return paseAbierto;
  }

}
