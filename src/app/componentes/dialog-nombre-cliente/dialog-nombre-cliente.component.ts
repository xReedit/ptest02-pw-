import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-nombre-cliente',
  templateUrl: './dialog-nombre-cliente.component.html',
  styleUrls: ['./dialog-nombre-cliente.component.css']
})
export class DialogNombreClienteComponent implements OnInit {

  nombre_cliente: string;
  isValidForm = false;
  constructor(
    private dialogRef: MatDialogRef<DialogNombreClienteComponent>,
  ) { }

  ngOnInit(): void {
  }

  verificarNombre(val: string) {
    this.isValidForm = val.length > 3;
    this.nombre_cliente = val;
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.nombre_cliente);
  }

}
