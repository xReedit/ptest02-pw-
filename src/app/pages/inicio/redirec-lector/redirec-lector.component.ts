import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';

@Component({
  selector: 'app-redirec-lector',
  templateUrl: './redirec-lector.component.html',
  styleUrls: ['./redirec-lector.component.css']
})
export class RedirecLectorComponent implements OnInit {


  constructor(
    private crudService: CrudHttpService,
    private activatedRoute: ActivatedRoute,
    private establecimientoService: EstablecimientoService,
    private router: Router,
    private verifyClientService: VerifyAuthClientService,
  ) { }

  ngOnInit(): void {
    // solo para url carta delivery
    const nomsede = this.activatedRoute.snapshot.params.nomsede;
    if ( nomsede ) {
      if ( nomsede.indexOf('co:') > -1 ) {
        const codUrl = nomsede.replace('co:', '');
        this.router.navigate(['/lector-qr'], { queryParams: {'co' : codUrl} });
        return;
      }

      this.verificarCartaSedeParam(nomsede);
    } else {
        this.router.navigate(['/']);
    }
  }

  private verificarCartaSedeParam(_nomsede: string) {
    // console.log('verificarCartaSedeParam', _nomsede);
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
        this.getInfoEstablecimiento(s);
        // registra scaneo
        this.establecimientoService.setRegisterScanQr(s, 'Delivery');
      } else {
        this.router.navigate(['/inicio']);
      }
      // console.log('res', res);
    });
  }

    // al scanear codigo qr DELIVERY para ir directo al establecimiento
    private getInfoEstablecimiento(_id) {
      const _dataEstablecimiento = {
        idsede: _id
      };
      this.crudService.postFree(_dataEstablecimiento, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        const _e = res.data[0];
        this.establecimientoService.set(_e);

        // setTimeout(() => {
          // console.log('navigate lector-success');
          this.router.navigate(['/lector-success']);
        // }, 500);
      });
    }

}
