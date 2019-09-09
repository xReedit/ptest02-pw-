import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';

@NgModule({
  declarations: [DatosDeliveryComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule
  ],
  exports: [
    DatosDeliveryComponent
  ]
})
export class ComponentesModule { }
