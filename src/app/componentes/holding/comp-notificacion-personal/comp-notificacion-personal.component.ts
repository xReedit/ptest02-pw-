import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-comp-notificacion-personal',
  templateUrl: './comp-notificacion-personal.component.html',
  styleUrls: ['./comp-notificacion-personal.component.css']
})
export class CompNotificacionPersonalComponent implements OnInit {

  @Output() cancelarNotificacion = new EventEmitter<void>();
  @Output() irAPagar = new EventEmitter<void>();

  isNotificando = true;

  constructor() { }

  ngOnInit(): void {
  }

  onCancelar(): void {
    this.cancelarNotificacion.emit();
  }

  onIrAPagar(): void {
    this.irAPagar.emit();
  }

}
