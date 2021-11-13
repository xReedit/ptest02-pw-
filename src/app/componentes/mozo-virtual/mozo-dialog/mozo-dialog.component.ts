import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-mozo-dialog',
  templateUrl: './mozo-dialog.component.html',
  styleUrls: ['./mozo-dialog.component.css']
})
export class MozoDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<MozoDialogComponent>,
  ) { }

  ngOnInit(): void {
  }

}
