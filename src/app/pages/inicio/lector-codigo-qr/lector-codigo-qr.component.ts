import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { Auth0Service } from 'src/app/shared/services/auth0.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { take } from 'rxjs/operators';

// import {QrScannerComponent} from 'angular2-qrscanner';

@Component({
  selector: 'app-lector-codigo-qr',
  templateUrl: './lector-codigo-qr.component.html',
  styleUrls: ['./lector-codigo-qr.component.css'],
  // encapsulation: ViewEncapsulation.None,
})
export class LectorCodigoQrComponent implements OnInit, OnDestroy {

  codQR = '';
  hasDevices: boolean;
  hasPermission = true;
  hasPermissionPosition = true;
  isProcesando = false;

  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo = null;
  indexSelectCamera = 0;
  isOptionChangeCamera = false;
  isCodigoQrValido = true;
  isCameraReady = false;


  // private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    private router: Router ) { }

  ngOnInit() {

    // const qrScanner = new QrScanner(this.videoplayer, (result: any) => console.log('decoded qr code:', result));

    // verifica si hay usuario logeado
    // this.verifyClientService.verifyClient();
    // this.veryfyClient = this.verifyClientService.verifyClient()
    //   .pipe(take(1))
    //   .subscribe(res => {
    //     console.log('res idcliente', res);
    //   });
  }

  ngOnDestroy(): void {
    // this.verifyClientService.unsubscribeClient();
    // this.veryfyClient.unsubscribe();
    this.currentDevice = null;
  }

  scanSuccessHandler($event: any) {
    console.log($event);
    this.codQR = $event;
    this.isProcesando = true;
    this.getPosition();
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  getPosition(): void {
    this.hasPermissionPosition = true;
    navigator.geolocation.getCurrentPosition((position: any) => {
      const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
      console.log('Latitude: ', position.coords.latitude);
      console.log('Longitude: ', position.coords.longitude);

      this.leerDatosQR(divicePos);

    }, this.showPositionError);
  }

  private showPositionError(error: any): void {
    if ( error.PERMISSION_DENIED ) {
      this.hasPermissionPosition = false;
    }

  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    this.indexSelectCamera = devices.length - 1;
    this.isOptionChangeCamera = this.indexSelectCamera > 0 ? true : false;
    this.deviceSelectChange();
    console.log(this.availableDevices);
  }

  onDeviceSelectChange(): void {
    this.isCameraReady = false;
    const countCamaras = this.availableDevices.length - 1;
    this.indexSelectCamera = this.indexSelectCamera === countCamaras ? 0 : this.indexSelectCamera + 1;
    this.deviceSelectChange();
  }

  private deviceSelectChange(): void {
    const device = this.availableDevices[this.indexSelectCamera];
    this.currentDevice = device || null;

    setTimeout(() => {
      this.isCameraReady = true;
    }, 1000);
  }

  // leer qr // formato keyQrPwa::5|-6.0283481:-76.9714528|1 -> mesa | coordenadas del local | idsede
  private leerDatosQR(divicePos: any) {
    this.isCodigoQrValido = true;
    let _codQr = [];

    try {
      _codQr = atob(this.codQR).split('::');
    } catch (error) {
      this.resValidQR(false);
      return;
    }

    const isValidKeyQR = _codQr[0] === 'keyQrPwa' ? true : false;

    // no se encuentra el key no es qr valido
    if ( !isValidKeyQR ) {
      this.resValidQR(isValidKeyQR);
      return;
    }

    // const dataQr = this.codQR.split('|');
    const dataQr = _codQr[1].split('|');
    const m = dataQr[0];
    const position = dataQr[1].split(':');
    const s = dataQr[2];

    const dataSend = {
      m: m,
      s: s
    };

    // setear idsede en clienteSOcket
    this.verifyClientService.getDataClient();
    this.verifyClientService.setIdSede(s);

    const localPos = { lat: parseFloat(position[0]), lng: parseFloat(position[1]) };

    // si las coordenadas del dispositivo esta a 1 un km del local
    const isPositionCorrect = this.arePointsNear(localPos, divicePos, 1);

    this.resValidQR(isPositionCorrect);
  }

  private resValidQR(isValid: boolean): void {
    if ( isValid ) {
      console.log('pase correcto');
      setTimeout(() => {
        this.router.navigate(['/lector-success']);
      }, 1000);
    } else {
      this.isCodigoQrValido = false;
    }
  }

  // calcula si esta dentro del rango
  private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
    const ky = 40000 / 360;
    const kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
    const dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    const dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= km;
  }

  volverALeer(): void {
    this.isProcesando = false;
    this.isCodigoQrValido = true;
  }

}
