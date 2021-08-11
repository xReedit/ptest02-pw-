import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-comp-ctrl-add-fast',
  templateUrl: './comp-ctrl-add-fast.component.html',
  styleUrls: ['./comp-ctrl-add-fast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompCtrlAddFastComponent implements OnInit {

  private _objItem: any;
  public cantidad = 0;
  public showDetalle = false;
  public showAnimateStop = false;

  private timerViewAfter = 0; // para volver la vista orginal
  private countSegundos = 10;
  private intervalShowaAfter: any;
  private isSuma = true;


  @Input() stopAdd: boolean; // si se detiene la adicion
  @Input() limitAdd: number; // si se detiene la adicion
  @Input() zoom: number; // tamaño del control
  @Input() comprimir: boolean; // tamaño del control
  @Output() objResponse = new EventEmitter<any>();
  @Input() cantidad_show: number;



  @Input()
  set objItem(val: any) {
    // console.log('val objItem =============00', val);
    this._objItem = val;
    this.cantidad = this._objItem.cantidad_selected ? this._objItem.cantidad_selected : 0;
    // this.cantidad = this.cantidad === 0 ? this._objItem.cantidad_seleccionada ? this._objItem.cantidad_seleccionada : 0 : this.cantidad;
    this.cantidad = this._objItem.cantidad_seleccionada ? this._objItem.cantidad_seleccionada : this.cantidad;
    // console.log('this._objItem A', this._objItem);

    this.cantidad_show = this.cantidad;
  }



  constructor() { }

  ngOnInit(): void {
    this.zoom = this.zoom ? this.zoom : 1;
    this.showViewComprimir();
  }

  // ngDoCheck(){
  //   console.log(‘count component CD runs’);
  // }

  showCantDetalle() {
    this.isSuma = true;
    if ( this.stopAdd && !this.showDetalle && this.cantidad !== 0) {
      this.showDetalle = true;
      this.timerViewAfter = this.countSegundos;
      this.timerShowView();
      return;
    }

    if ( this.stopAdd ) {
      this.showAnimateStop = true;
      setTimeout(() => {
        this.showAnimateStop = false;
      }, 200);

      return;
    }
    this.add();
    this.showDetalle = true;

    this.timerViewAfter = this.countSegundos;
    this.timerShowView();

  }

  private timerShowView() {
    this.intervalShowaAfter = setInterval(() => {
      // console.log('this.timerViewAfter', this.timerViewAfter);
      this.timerViewAfter--;
      if ( this.timerViewAfter <= 0 ) {
        this.timerViewAfter = 0;
        this.showDetalle = this.comprimir === false ? true : false; // si manda no comprimir
        clearInterval(this.intervalShowaAfter);
      }
    }, 1000);
  }

  add() {
    // console.log('this.limitAdd', this.limitAdd);
    this.limitAdd = this.limitAdd ? this.limitAdd : NaN;
    this.cantidad = this.cantidad_show !== this.cantidad ? this.cantidad_show : this.cantidad;

    this.timerViewAfter = this.countSegundos;
    this.isSuma = true;

    if ( !isNaN(this.limitAdd) ) {
      this.stopAdd = this.limitAdd <= 0;
    }

    if ( this.stopAdd ) {
      this.showAnimateStop = true;
      setTimeout(() => {
        this.showAnimateStop = false;
      }, 200);
      return; }
    this.cantidad++;
    this.emitResponse();
  }

  menos() {
    this.cantidad = this.cantidad_show !== this.cantidad ? this.cantidad_show : this.cantidad;
    this.timerViewAfter = this.countSegundos;
    this.cantidad--;
    this.isSuma = false;
    if ( this.cantidad === 0) {
      // this.showDetalle = false;
      this.showViewComprimir();
    }

    this.emitResponse();
  }

  private showViewComprimir() {
    this.showDetalle = this.comprimir === false ? true : false;
  }


  emitResponse() {
    if ( !this._objItem ) { this._objItem = {}; }
    this._objItem.cantidad_selected = this.cantidad;
    this._objItem.cantidad_seleccionada = this.cantidad; // add por list item pedido
    this.cantidad_show = this.cantidad;
    this._objItem.isSuma_selected = this.isSuma;
    this.objResponse.emit(this._objItem);
  }

}
