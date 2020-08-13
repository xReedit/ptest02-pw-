import { Component, OnInit, Input } from '@angular/core';
import { DatosCalificadoModel } from 'src/app/modelos/datos.calificado.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-comp-calificacion',
  templateUrl: './comp-calificacion.component.html',
  styleUrls: ['./comp-calificacion.component.css']
})
export class CompCalificacionComponent implements OnInit {
  countFin = 3;
  private intervalConteo = null;
  @Input() dataCalificado: DatosCalificadoModel;

  comentario = '';

  constructor(
    private crudService: CrudHttpService
  ) { }

  ngOnInit() {
    this.dataCalificado.calificacion = 0;
  }

  onRatingChange($event: any) {
    // console.log('calificacion', $event);
    this.dataCalificado.calificacion =  $event.rating;
    if (this.dataCalificado.showTxtComentario) {return; }
    this.goAgradecimiento();
  }

  goAgradecimiento() {
    if ( this.dataCalificado.showMsjTankyou ) {
      this.countFin = 2;
      this.cuentaRegresivaCalificacion();
    }
  }

  // despues que califica cuenta 2 segundo para guardar
  private cuentaRegresivaCalificacion() {
    if ( this.countFin <= 0 ) {
      this.intervalConteo = null;
      this.guardarCalificacion();
    } else {
      this.conteoFinEncuesta();
    }
  }

  private conteoFinEncuesta(): void {
    this.intervalConteo =  setTimeout(() => {
      this.countFin --;
      this.cuentaRegresivaCalificacion();
    }, 1000);
  }

  private guardarCalificacion() {
    this.dataCalificado.comentario = this.comentario;

    console.log('this.dataCalificado', this.dataCalificado);
    const _data = {
      dataCalificacion : this.dataCalificado
    };

    this.crudService.postFree(_data, 'delivery', 'calificar-servicio', false)
      .subscribe(res => console.log(res));
  }


}
