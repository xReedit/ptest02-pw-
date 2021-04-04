import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-calificacion-sede',
  templateUrl: './dialog-calificacion-sede.component.html',
  styleUrls: ['./dialog-calificacion-sede.component.css']
})
export class DialogCalificacionSedeComponent implements OnInit {

  dataComentarios: any;
  listComentarios: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.dataComentarios = data;
    this.listComentarios = this.dataComentarios.listCalificacion;

  }

  ngOnInit(): void {
  }

}
