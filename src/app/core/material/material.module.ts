import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// material
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTooltipModule } from '@angular/material/tooltip';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatButtonModule,
    MatRippleModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
    // MatTooltipModule
  ],
  exports: [
    MatButtonModule,
    MatRippleModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
    // MatTooltipModule
  ]
})
export class MaterialModule { }
