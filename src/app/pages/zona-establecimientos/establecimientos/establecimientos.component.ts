import { Component, OnInit } from '@angular/core';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { RouterEvent, Router } from '@angular/router';

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
    private router: Router
  ) { }

  ngOnInit() {
    this.xLoadCategoria();
  }

  private xLoadCategoria() {
    this.crudService.postFree(null, 'delivery', 'get-categorias')
      .subscribe(res => {
        this.listIcoCategoria = res.data.filter(x => x.img !== '');
        console.log('this.listIcoCategoria', this.listIcoCategoria);
      });
  }

  goComercioCategoria(idsede_categoria: number) {
    setTimeout(() => {
      this.router.navigate(['/zona-delivery/categorias'], { queryParams: { id: idsede_categoria } });
    }, 300);
  }

}
