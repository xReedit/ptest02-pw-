import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosDeliveryComponent } from './datos-delivery/datos-delivery.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../core/material/material.module';
import { DebounceClickDirective } from '../shared/directivas/debounce-click.directive';
import { EncuestaOpcionComponent } from './encuesta-opcion/encuesta-opcion.component';
import { DialogUbicacionComponent } from './dialog-ubicacion/dialog-ubicacion.component';

@NgModule({
  declarations: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent,
    // DialogUbicacionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
  ],
  exports: [
    DatosDeliveryComponent,
    DebounceClickDirective,
    EncuestaOpcionComponent
  ]
})
export class ComponentesModule { }
