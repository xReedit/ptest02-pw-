import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SocketService } from 'src/app/shared/services/socket.service';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { CategoriaModel } from 'src/app/modelos/categoria.model';
import { ItemModel } from 'src/app/modelos/item.model';

@Component({
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.css']
})
export class CartaComponent implements OnInit {

  public objCarta: any;
  public isCargado = true;

  public showCategoria = false;
  public showSecciones = false;
  public showItems = false;
  public showToolBar = false;

  tituloToolBar = '';

  rippleColor = 'rgb(255,238,88, 0.5)';

  objSecciones: SeccionModel[] = [];
  objItems: ItemModel[] = [];

  constructor(
      private socketService: SocketService
      ) { }

  ngOnInit() {
    this.isCargado = true;
    this.socketService.connect();
    this.socketService.onGetCarta().subscribe(res => {
      this.objCarta = res;
      this.isCargado = false;
      this.showCategoria = true;
      console.log(this.objCarta);
    });
  }

  getSecciones(categoria: CategoriaModel) {
    console.log(categoria);
    setTimeout(() => {
      this.objSecciones = categoria.secciones;
      this.showSecciones = true;
      this.showCategoria = false;
      this.showToolBar = true;

      this.tituloToolBar = categoria.des;
    }, 150);
  }

  getItems(seccion: SeccionModel) {
    console.log(seccion);
    setTimeout(() => {
      this.objItems = seccion.items;
      this.showSecciones = false;
      this.showItems = true;
      this.tituloToolBar += ' / ' + seccion.des;
    }, 150);

  }

  setTituloToolBar() {
    
  }

  goBack() {
    if (this.showItems) { 
      this.showItems = false;
      this.showSecciones = true;
      this.tituloToolBar = this.tituloToolBar.split(' / ')[0];
      return;
    }
    if (this.showSecciones) { this.showSecciones = false; this.showToolBar = false; this.showCategoria = true; }
  }
}
