import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';

@NgModule({
  declarations: [DatosDeliveryComponent, DebounceClickDirective],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
  ],
  exports: [
    DatosDeliveryComponent, DebounceClickDirective
  ]
})
export class ComponentesModule { }
