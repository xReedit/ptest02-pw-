import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

interface Marca {
  idsede_marca: number;
  idorg_marca: number;
  nombre_comercial: string;
  oferta_comercial: string;
  imagen_url_comercial?: string;
  estado?: boolean;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  @Input() marcas: Marca[] = [];
  @Output() marcaSelected = new EventEmitter<Marca>();
  
  constructor(    
  ) {}

  selectMarca(marca: Marca): void {
    console.log('this.selectedMarca', marca);
    this.marcaSelected.emit(marca);
  }

  trackByMarcaId(index: number, marca: Marca): number {
    return marca.idsede_marca;
  }
}