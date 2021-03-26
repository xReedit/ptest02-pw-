import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-comp-ctrl-add-fast',
  templateUrl: './comp-ctrl-add-fast.component.html',
  styleUrls: ['./comp-ctrl-add-fast.component.css']
})
export class CompCtrlAddFastComponent implements OnInit {

  @Input() objItem: any;
  @Input() stopAdd: boolean; // si se detiene la adicion
  @Input() limitAdd: number; // si se detiene la adicion
  @Output() objResponse = new EventEmitter<any>();

  public cantidad = 0;
  public showDetalle = false;
  public showAnimateStop = false;


  // @HostListener('blur', ['$event.target']) onBlur() {
  //   console.log(`onBlur()`);
  // }

  @HostListener('blur')
  onBlur() {
     console.log('blur');
   }


  constructor() { }

  ngOnInit(): void {
  }

  showCantDetalle() {
    if ( this.stopAdd ) {
      this.showAnimateStop = true;
      setTimeout(() => {
        this.showAnimateStop = false;
      }, 200);

      return;
    }
    this.add();
    this.showDetalle = true;
  }

  add() {
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
    this.cantidad--;
    if ( this.cantidad === 0) {
      this.showDetalle = false;
    }

    this.emitResponse();
  }

  outFocusCant() {
    console.log('outFocusCant');
  }

  emitResponse() {
    this.objItem.cantidad_selected = this.cantidad;
    this.objResponse.emit(this.objItem);
  }

}
