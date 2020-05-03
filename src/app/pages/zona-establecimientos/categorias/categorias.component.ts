import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';
import { Router, ActivatedRoute } from '@angular/router';
// import { AuthService } from 'src/app/shared/services/auth.service';
// import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { VerifyAuthClientService } from 'src/app/shared/services/verify-auth-client.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { MatDialog } from '@angular/material/dialog';
import { SocketClientModel } from 'src/app/modelos/socket.client.model';
import { DialogSelectDireccionComponent } from 'src/app/componentes/dialog-select-direccion/dialog-select-direccion.component';
import { CalcDistanciaService } from 'src/app/shared/services/calc-distancia.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
// import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  // rippleColor = 'rgb(255,238,88, 0.2)';

  listEstablecimientos: DeliveryEstablecimiento[];

  codigo_postal_actual: string;
  infoClient: SocketClientModel;
  isNullselectedDireccion = true;
  isSelectedDireccion = false;
  direccionCliente: DeliveryDireccionCliente;

  listSubCatFiltros: any = []; // sub categoria para filtrar

  private idcategoria_selected: any;
  // private veryfyClient: Subscription = null;

  constructor(
    private crudService: CrudHttpService,
    private router: Router,
    // private authService: AuthService,
    // private infoToken: InfoTockenService,
    private verifyClientService: VerifyAuthClientService,
    private listenService: ListenStatusService,
    private dialogDireccion: MatDialog,
    private calcDistanceService: CalcDistanciaService,
    private establecimientoService: EstablecimientoService,
    private socketService: SocketService,
    // private activatedRoute: ActivatedRoute,
    // private navigatorService: NavigatorLinkService,
  ) { }

  ngOnInit() {
    // window.history.forward();
    // history.pushState(null, null, location.href);
    // window.onpopstate = function () {
    //     history.go(1);
    // };
    // history.pushState(null, null, document.title);

    this.idcategoria_selected = localStorage.getItem('sys::cat');
    this.listSubCatFiltros = JSON.parse(atob(localStorage.getItem('sys:subcat'))); // filtro para celulares

    // preparr filtro
    this.listSubCatFiltros.map(x => x.selected = false);
    this.listSubCatFiltros.unshift({ id: 0, descripcion: 'Todos', selected: true });

    // console.log('this.listSubCatFiltros :>> ', this.listSubCatFiltros);

    // this.activatedRoute.queryParams.subscribe(params => {
    //   if ( params['id'] ) {
    //     this.idcategoria_selected = params['id'];
    //     localStorage.setItem('sys::cat', this.idcategoria_selected.toString());
        // console.log('this.idcategoria_selected', this.idcategoria_selected);
    //   }
    // });

    // this.loadEstablecimientos();
    this.infoClient = this.verifyClientService.getDataClient();

    this.listenService.isChangeDireccionDelivery$.subscribe((res: DeliveryDireccionCliente) => {
      if ( res ) {
        this.codigo_postal_actual = res.codigo || '0';
        this.isNullselectedDireccion = false;
        this.direccionCliente = res;
        this.infoClient.direccionEnvioSelected = this.direccionCliente;
        this.loadEstablecimientos();
      } else {

      }
    });

     // si no hay direccion abre el dialog
     setTimeout(() => {
      if ( this.isNullselectedDireccion ) {
        this.openDialogDireccion();
      }
    }, 800);
  }

  loadEstablecimientos() {
    const _data = {
      idsede_categoria: this.idcategoria_selected,
      codigo_postal: this.codigo_postal_actual
    };

    this.listEstablecimientos = [];
    this.crudService.postFree(_data, 'delivery', 'get-establecimientos', false)
      .subscribe( (res: any) => {
        // setTimeout(() => {
          this.listEstablecimientos = res.data;
          this.listEstablecimientos.map((dirEstablecimiento: DeliveryEstablecimiento) => {
            dirEstablecimiento.visible = true;
            // this.calcDistancia(x);
            this.calcDistanceService.calculateRoute(this.direccionCliente, dirEstablecimiento);
            // dirEstablecimiento.c_servicio = _c_servicio;

          });

          // console.log('this.listEstablecimientos', this.listEstablecimientos);
        // }, 500);
        // console.log(this.listEstablecimientos);
      });
  }


  // private calcDistancia(direccionEstablecimiento: DeliveryEstablecimiento) {
  //   this.calcDistanceService.calculateRoute(this.direccionCliente, direccionEstablecimiento);
  // }

  itemSelected($event: DeliveryEstablecimiento) {
    // console.log('establecimiento seleccionada', $event);

    this.socketService.closeConnection();

    this.verifyClientService.setIdSede($event.idsede);
    this.verifyClientService.setIdOrg($event.idorg);
    this.verifyClientService.setIsDelivery(true);

    this.establecimientoService.set($event);

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
      // panelClass: 'my-full-screen-dialog',
      panelClass: ['my-dialog-orden-detalle', 'my-dialog-scrool'],
    });

    dialogRef.afterClosed().subscribe(
      data => {
        if ( !data ) { return; }
        // console.log('data dialog', data);
        this.direccionCliente = data;
        this.verifyClientService.setDireccionDeliverySelected(this.direccionCliente);
        // this.setDireccion(data);
      }
    );
  }

  aplicarFitroSubCategoria(itemFiltro: any) {
    this.listSubCatFiltros.map(x => x.selected = false);
    itemFiltro.selected = true;

    if ( itemFiltro.id === 0 ) { // todos
      this.listEstablecimientos
      .map((e: DeliveryEstablecimiento) => {e.visible = true ; });
      return;
    }

    this.listEstablecimientos
      .map((e: DeliveryEstablecimiento) => {e.visible = false; return e; })
      .filter((e: DeliveryEstablecimiento) => e.idsede_subcategoria.indexOf(itemFiltro.id) > -1  )
      .map((e: DeliveryEstablecimiento) => e.visible = true);
  }

}
