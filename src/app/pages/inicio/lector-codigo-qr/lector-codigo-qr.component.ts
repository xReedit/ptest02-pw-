import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
// import { Auth0Service } from 'src/app/shared/services/auth0.service';
// import { Subscription } from 'rxjs/internal/Subscription';
// import { take } from 'rxjs/operators';

// import {
//   toLatLon, toLatitudeLongitude, headingDistanceTo, moveTo, insidePolygon, insideCircle
// } from 'geolocation-utils';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogUbicacionComponent } from 'src/app/componentes/dialog-ubicacion/dialog-ubicacion.component';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { IfStmt } from '@angular/compiler';

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
  isSedeRequiereGPS = false; // si sede ruquiere gps
  isSoloLLevar = false; // si escanea qr solo para llevar
  isDelivery = false; // si escanea qr solo para llevar


  // hasPermissionPosition = false;

  private isDemo = false;
  private divicePos: any;
  private _comercioUrl = '';
  private isActivaCamara = true;


  // private veryfyClient: Subscription = null;

  constructor(
    private verifyClientService: VerifyAuthClientService,
    // private infoTokenService: InfoTockenService,
    private crudService: CrudHttpService,
    private dialog: MatDialog,
    private establecimientoService: EstablecimientoService,
    private router: Router,
    private routerActive: ActivatedRoute
    ) { }

  ngOnInit() {

    this._comercioUrl = this.routerActive.snapshot.queryParamMap.get('co');

    // lee el url si es directo
    if (this._comercioUrl) {
      this.isActivaCamara = false;
      this.codQR = this._comercioUrl;
      this.leerDatosQR();
    }
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
    this.leerDatosQR();
    // this.getPosition();
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  // getPosition(): void {
  //   this.hasPermissionPosition = true;
  //   navigator.geolocation.getCurrentPosition((position: any) => {
  //     const divicePos = { lat: position.coords.latitude, lng: position.coords.longitude};
  //     // this.leerDatosQR(divicePos);
  //     this.divicePos = divicePos;

  //   }, this.showPositionError);
  // }

  // verifyAceptPosition() {
  //   navigator.geolocation.getCurrentPosition(this.getPosition, (error: any) => {
  //     // El segundo parámetro es la función de error
  //         switch (error.code) {
  //             case error.PERMISSION_DENIED:
  //               this.hasPermissionPosition = false;
  //                 // El usuario denegó el permiso para la Geolocalización.
  //                 break;
  //             case error.POSITION_UNAVAILABLE:
  //                 // La ubicación no está disponible.
  //                 this.hasPermissionPosition = false;
  //                 break;
  //             case error.TIMEOUT:
  //                 // Se ha excedido el tiempo para obtener la ubicación.
  //                 break;
  //             case error.UNKNOWN_ERROR:
  //                 // Un error desconocido.
  //                 this.hasPermissionPosition = false;
  //                 break;
  //         }
  //   });
  // }

  private showPositionError(error: any): void {
    // if ( error.PERMISSION_DENIED ) {
      this.hasPermissionPosition = false;
    // }

  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    this.indexSelectCamera = devices.length - 1;
    this.isOptionChangeCamera = this.indexSelectCamera > 0 ? true : false;
    this.deviceSelectChange();
    // console.log(this.availableDevices);
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
  private leerDatosQR() {
    this.isCodigoQrValido = true;
    let _codQr = [];

    // console.log('this.codQR', this.codQR);

    // 310122 carta/nomsede  carta virtual delivery
    if ( this.codQR.indexOf('carta/') > -1 ) {
      const posCarta = this.codQR.indexOf('carta/') + 6;
      const nomSedeCV = this.codQR.slice(posCarta);
      this.verificarCartaSedeParam(nomSedeCV);
      return;
    }

    // 140820 -> con este cambio el codigo es leido desde cualquier lector,
    // enviandolo a ala web o si lo scanean desde papaya lo envian a la carta
    // si el codigo viene con la pagina
    if ( this.codQR.indexOf('papaya.com.pe') > -1 ) {
      const _partUrl = this.codQR.split('co=');
      // console.log('_cadena', _partUrl);

      // quita la parte del url
      this.codQR = _partUrl[1];
    }



    try {
      _codQr = atob(this.codQR).split('::');
    } catch (error) {
      this.resValidQR(false);
      return;
    }

    const isValidKeyQR = _codQr[0] === 'keyQrPwa' ? true : false;
    if ( !isValidKeyQR ) {
      this.isDemo = _codQr[0] === 'keyQrPwaDemo' ? true : false;
    }


    // no se encuentra el key no es qr valido
    if ( !isValidKeyQR && !this.isDemo) {
      this.resValidQR(isValidKeyQR);
      return;
    }

    // const dataQr = this.codQR.split('|');
    const dataQr = _codQr[1].split('|');
    const m = dataQr[0];
    const s = dataQr[2];
    const o = dataQr[3];

    let canal = ''; // canal de consumo

    // -1 = solo llevar // activa ubicacion
    this.isSoloLLevar =  m === '-1' ? true : false;
    this.isDelivery =  m === '-2' ? true : false;

    canal = this.isSoloLLevar ? 'LLevar' : 'Mesa ' + m;
    canal = this.isDelivery ? 'Delivery' : canal;

    const dataSend = {
      m: m,
      s: s
    };

    // consultar si sede requiere geolocalizacion
    const dataHeader = {
      idsede: s
    };

    this.crudService.postFree(dataHeader, 'ini', 'info-sede-gps', false)
      .subscribe((res: any) => {
        this.isSedeRequiereGPS = res.data[0].pwa_requiere_gps.toString() === '0' ? false : true;
        this.isSedeRequiereGPS = this.isSoloLLevar ? true : this.isSedeRequiereGPS;
        this.isSedeRequiereGPS = this.isDelivery ? false : this.isSedeRequiereGPS;


        // setear idsede en clienteSOcket
        this.verifyClientService.getDataClient();
        if ( !this.isSoloLLevar ) { this.verifyClientService.setMesa(m); }
        this.verifyClientService.setIdSede(s);
        this.verifyClientService.setQrSuccess(true);
        this.verifyClientService.setIsSoloLLevar(this.isSoloLLevar);
        this.verifyClientService.setIsDelivery(this.isDelivery);

        if ( this.isDelivery ) {
          // this.infoTokenService.converToJSON();
          // this.infoTokenService.infoUsToken.isDelivery = true;
          // this.infoTokenService.set();
          this.verifyClientService.setMesa(0);
          this.verifyClientService.setIdOrg(o);
          this.getInfoEstablecimiento(s);

        }
        // this.verifyClientService.setDataClient();

        const position = dataQr[1].split(':');
        const localPos = { lat: parseFloat(position[0]), lng: parseFloat(position[1]) };

        const isPositionCorrect = true;
        if ( this.isSedeRequiereGPS ) {
          // this.getPosition();
          // isPositionCorrect = this.isDemo ? true : this.arePointsNear(localPos, this.divicePos, 1);
          this.openDialogPOS(localPos);
        } else {
          this.resValidQR(isPositionCorrect);
        }

        // registra scaneo
        this.establecimientoService.setRegisterScanQr(s, canal);

    });
  }

  // al scanear codigo qr DELIVERY para ir directo al establecimiento
  private getInfoEstablecimiento(_id, isLinkCartaVirtual = false) {
    const _dataEstablecimiento = {
      idsede: _id
    };
    this.crudService.postFree(_dataEstablecimiento, 'delivery', 'get-establecimientos', false)
    .subscribe( (res: any) => {
      const _e = res.data[0];
      this.establecimientoService.set(_e);

      if ( isLinkCartaVirtual ) {
        this.router.navigate(['/lector-success']);
      }
    });
  }

  private openDialogPOS(localPos: any) {
    let isPositionValid = false;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      cLocal: localPos,
      isDemo: this.isDemo
    };
    const dialogRef = this.dialog.open(DialogUbicacionComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { isPositionValid = false; }
        // console.log('data dialog', data);
        isPositionValid = data;
        this.resValidQR(isPositionValid);
      }
    );
  }

  private resValidQR(isValid: boolean): void {
    if ( isValid ) {
      // console.log('pase correcto');
      setTimeout(() => {
        this.router.navigate(['/lector-success']);
      }, 1000);
    } else {
      this.isCodigoQrValido = false;
    }
  }

  // calcula si esta dentro del rango
  // private arePointsNear(checkPoint: any, centerPoint: any, km: number): boolean {
  //   // const ky = 40000 / 360;
  //   // const kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
  //   // const dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
  //   // const dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
  //   // return Math.sqrt(dx * dx + dy * dy) <= km;

  //   const center = {lat: centerPoint.lat, lon: centerPoint.lng };
  //   const radius = 65; // meters

  //   // insideCircle({lat: 51.03, lon: 4.05}, center, radius) // true
  //   return insideCircle({lat: checkPoint.lat, lon: checkPoint.lng}, center, radius);  // false
  // }

  volverALeer(): void {
    this.isProcesando = false;
    this.isCodigoQrValido = true;
  }



  private verificarCartaSedeParam(_nomsede: string) {
    // setear idsede en clienteSOcket
    this.verifyClientService.getDataClient();

    const _dataSend = { nomsede: _nomsede };
    this.crudService.postFree(_dataSend, 'ini', 'carta-virtual', false)
    .subscribe((res: any) => {
      if (res.success && res.data.length > 0) {
        const s = res.data[0].idsede;
        const o = res.data[0].idorg;

        this.verifyClientService.setQrSuccess(true);
        this.verifyClientService.setIsDelivery(true);
        this.verifyClientService.setMesa(0);
        this.verifyClientService.setIdSede(s);
        this.verifyClientService.setIdOrg(o);
        this.getInfoEstablecimiento(s, true);
        // registra scaneo
        this.establecimientoService.setRegisterScanQr(s, 'Delivery');
      } else {
        this.router.navigate(['/inicio']);
      }
      // console.log('res', res);
    });
  }

}
