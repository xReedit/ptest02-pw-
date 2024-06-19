import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: 'comp-teclado-numerico',
  templateUrl: './comp-teclado-numerico.component.html',
  styleUrls: ['./comp-teclado-numerico.component.css']
})
export class CompTecladoNumerico implements OnInit {
    @Output() numberEntered = new EventEmitter<string>();
    @Output() numberOut = new EventEmitter<string>();
    rippleColor = 'rgb(255,238,88, 0.5)';
    numReturn = '';
    constructor() { }

    ngOnInit(): void {
        
    }

    addNumber = (num: number) => {
        this.numReturn = `${this.numReturn}${num}`;
        console.log('num', num);
        this.numberOut.emit(this.numReturn);
    }

    deleteNumber = () => {
        //revome last number
        this.numReturn = this.numReturn.slice(0, -1);
        console.log('deleteNumber');
        this.numberOut.emit(this.numReturn);
    }

    enterNumber = () => {
        console.log('enterNumber');
        // disparar un evento con el numero
        this.numberEntered.emit(this.numReturn);
    }
}