import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { RouterEvent, Router } from '@angular/router';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';

@Component({
  selector: 'app-establecimientos',
  templateUrl: './establecimientos.component.html',
  styleUrls: ['./establecimientos.component.css']
})
export class EstablecimientosComponent implements OnInit {

  imgIcoCategoria = 'assets/images/icon-app/';
  listIcoCategoria: any;
  constructor(
    private crudService: CrudHttpService,
    private navigatorService: NavigatorLinkService,
    private router: Router
  ) { }

  ngOnInit() {
    this.xLoadCategoria();
    // this.navigatorService.disableGoBack();
    // window.onpopstate = function () {
    //   // history.go(0);
    //   window.history.forward();
    // };
    // window.history.forward();
  }

  private xLoadCategoria() {
    this.crudService.postFree(null, 'delivery', 'get-categorias')
      .subscribe(res => {
        this.listIcoCategoria = res.data.map(x => {x.visible = x.img !== ''; return x; });
        const _allCategorias = JSON.stringify(this.listIcoCategoria);
        localStorage.setItem('sys:allcat', btoa(_allCategorias));
        console.log('this.listIcoCategoria', this.listIcoCategoria);
      });
  }

  goComercioCategoria(idsede_categoria: number) {
    const _subCategorias = JSON.stringify(this.listIcoCategoria.filter(x => x.idsede_categoria === idsede_categoria)[0].arritems);
    localStorage.setItem('sys:subcat', btoa(_subCategorias));
    localStorage.setItem('sys::cat', idsede_categoria.toString());
    setTimeout(() => {
      this.router.navigate(['/zona-delivery/categorias'], { queryParams: { id: idsede_categoria } });
    }, 300);
  }

}
