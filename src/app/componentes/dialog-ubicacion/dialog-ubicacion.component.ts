import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  insideCircle
} from 'geolocation-utils';
import { GeolocationService } from 'src/app/shared/services/geolocation.service';

// 65 metros: es el radio con el que se venia validando que el cliente este en el local.
// Se expresa en km porque arePointsNear recibe km.
const RADIO_UBICACION_KM = 0.065;

@Component({
  selector: 'app-dialog-ubicacion',
  templateUrl: './dialog-ubicacion.component.html',
  styleUrls: ['./dialog-ubicacion.component.css']
})
export class DialogUbicacionComponent implements OnInit {

  cLocal: any; // coordenadas del establecimientos
  cDispositivo: any; // coordenadas del dispositivo
  hasPermissionPosition = true;

  constructor(
    private dialogRef: MatDialogRef<DialogUbicacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private geolocationService: GeolocationService
  ) {

    this.cLocal = data.cLocal;

   }

  ngOnInit() {
    // ponytail: sin espera artificial; obtenerPosicion ya trae su propio timeout de 10 s
    this.getPosition();
  }

  private getPosition() {
    this.geolocationService.obtenerPosicion()
      .then(pos => {
        this.cDispositivo = { lat: pos.latitude, lng: pos.longitude };
        this.hasPermissionPosition = true;
        this.data.posIssValid = this.data.isDemo
          ? true
          : this.arePointsNear(this.cLocal, this.cDispositivo, RADIO_UBICACION_KM);
        this.cerrarDlg();
      })
      .catch(() => {
        // ponytail: el aviso al usuario y la alternativa manual las da quien abre el dialogo
        // (lector-codigo-qr) al recibir posIssValid = false.
        this.hasPermissionPosition = false;
        this.data.posIssValid = false;
        this.cerrarDlg();
      });
  }

  private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
    const center = { lat: centerPoint.lat, lon: centerPoint.lng };
    const radius = km * 1000; // insideCircle trabaja en metros

    return insideCircle({ lat: checkPoint.lat, lon: checkPoint.lng }, center, radius);
  }

  cerrarDlg(): void {
    this.dialogRef.close(this.data.posIssValid);
  }

}
