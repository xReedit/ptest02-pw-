import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-comp-caja-texto',
  templateUrl: './comp-caja-texto.component.html',
  styleUrls: ['./comp-caja-texto.component.css']
})
export class CompCajaTextoComponent implements OnInit {
  @Output() textChanged = new EventEmitter();
  @Input() placeholder_txt: string;

  label_txt = 'Buscamos en la ciudad para llevarselo lo que necesecita';
  // placeholder_txt = 'Si cabe en la mochila se lo llevamos';
  constructor() { }

  ngOnInit(): void {
  }

  changeText(val: string) {
    this.textChanged.emit(val);
  }


}
