import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-loading',
  templateUrl: './dialog-loading.component.html',
  styleUrls: ['./dialog-loading.component.css']
})
export class DialogLoadingComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<DialogLoadingComponent>
    ) {
    }

  ngOnInit() {
    setTimeout(() => {
      this.dialogRef.close();
    }, 1200);
  }

}
