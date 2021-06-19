import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-desicion',
  templateUrl: './dialog-desicion.component.html',
  styleUrls: ['./dialog-desicion.component.css']
})
export class DialogDesicionComponent implements OnInit {
  msj = '';
  titleBtnCancel = 'No';
  titleBtnSuccess = 'Si, por favor';
  constructor(
    private dialogRef: MatDialogRef<DialogDesicionComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    const idMsj = data ? data.idMjs : 0;
    switch (idMsj) {
      case 0:
        this.msj = 'Desea que se le notifique cuando su pedido este listo?';
        break;
      case 1:
        this.msj = 'Desea saber cuando tenga descuentos y/o ofertas?';
        break;
    }
  }

  ngOnInit() {
  }


  cerrarDlg(value: boolean): void {
    this.dialogRef.close(value);
  }

}
