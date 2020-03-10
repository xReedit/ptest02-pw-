import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { Router } from '@angular/router';
// import { AuthService } from 'src/app/shared/services/auth.service';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialog } from '@angular/material/dialog';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  // rippleColor = 'rgb(255,238,88, 0.2)';

  listEstablecimientos: DeliveryEstablecimiento[];

  codigo_postal_actual: number;
  infoClient: SocketClientModel;
  isNullselectedDireccion = true;
  // private veryfyClient: Subscription = null;

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    // private authService: AuthService,
    // private infoToken: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    private dialogDireccion: MatDialog,
  ) { }

  ngOnInit() {
    // this.loadEstablecimientos();
    this.infoClient = this.verifyClientService.getDataClient();

    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res && res.codigo !== this.codigo_postal_actual) {
        this.codigo_postal_actual = res.codigo;
        this.isNullselectedDireccion = false;
        this.loadEstablecimientos();
      }
    });
  }

  loadEstablecimientos() {
    const _data = {
      idsede_categoria: 1,
      codigo_postal: this.codigo_postal_actual
    };

    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe((res: any) => {
        this.listEstablecimientos = res.data;
        console.log(this.listEstablecimientos);
      });
  }

  itemSelected($event: DeliveryEstablecimiento) {
    console.log($event);
    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(true);

    this.router.navigate(['/callback-auth']);

    // this.veryfyClient = this.verifyClientService.verifyClient()
    //   .subscribe(res => {
    //     if ( !res ) {return; }
    //     // console.log('res idcliente', res);
    //     this.setInfoToken(res);
    //   });
  }

  openDialogDireccion() {
    // const dialogConfig = new MatDialogConfig();

    const dialogRef = this.dialogDireccion.open(DialogSelectDireccionComponent, {
      panelClass: 'my-full-screen-dialog',
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        console.log('data dialog', data);
        this.verifyClientService.setDireccionDeliverySelected(data);
        // this.setDireccion(data);
      }
    );
  }

  // setDireccion(direccion: DeliveryDireccionCliente) {
  //   if ( direccion ) {
  //     // this.isSelectedDireccion = true;
  //     // const _direccion = direccion.direccion.split(',');
  //     // this.nomDireccionCliente = _direccion[0] + ' ' + _direccion[1];
  //     this.listenService.setChangeDireccionDelivery(direccion);
  //   }

  // }

  // private setInfoToken(token: any): void {
  //   const _token = `eyCJ9.${btoa(JSON.stringify(token))}`;
  //   this.authService.setLocalToken(_token);
  //   this.authService.setLoggedStatus(true);
  //   this.infoToken.converToJSON();

  //   this.router.navigate(['./pedido']);
  // }

}
