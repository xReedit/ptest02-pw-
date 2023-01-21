import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-out-auth-ios',
  templateUrl: './dialog-out-auth-ios.component.html',
  styleUrls: ['./dialog-out-auth-ios.component.css']
})
export class DialogOutAuthIosComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<DialogOutAuthIosComponent>,
  ) { }

  ngOnInit(): void {
  }

  cerrarDlg(value: boolean): void {
    this.dialogRef.close(value);
  }

}
