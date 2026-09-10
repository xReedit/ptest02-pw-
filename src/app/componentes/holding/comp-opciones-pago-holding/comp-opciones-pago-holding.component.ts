import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-comp-opciones-pago-holding',
  templateUrl: './comp-opciones-pago-holding.component.html',
  styleUrls: ['./comp-opciones-pago-holding.component.css']
})
export class CompOpcionesPagoHoldingComponent implements OnInit {

  @Output() opcionSeleccionada = new EventEmitter<string>();
  @Output() volverAtras = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  seleccionarOpcion(opcion: 'llamar_personal' | 'pagar_confirmar'): void {
    this.opcionSeleccionada.emit(opcion);
  }

  onVolverAtras(): void {
    this.volverAtras.emit();
  }

}
