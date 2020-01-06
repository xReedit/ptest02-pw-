import { Component, OnInit } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit {
  nomSede = [];
  infoToken: UsuarioTokenModel;
  titulo_inicio: '';
  titulo_fin: '';
  listPreguntas: any;
  listOption: any;

  private dataPost: any;

  constructor(
    private infoTokenService: InfoTockenService,
    private crudService: CrudHttpService
  ) { }

  ngOnInit() {
    this.infoToken = this.infoTokenService.getInfoUs();
    console.log(this.infoToken);
    this.nomSede = localStorage.getItem('sys::s').split('|');

    this.dataPost = {
      idsede: this.infoToken.idsede,
      // idcliente: this.infoTokenService.getInfoUs().idcliente
    };

    this.loadOpciones();

    this.loadEncuesta();
  }

  private loadEncuesta(): void {
    this.crudService.postFree(this.dataPost, 'encuesta', 'la-encuesta', false).subscribe( (res: any) => {
      console.log(res);
      if ( res.success ) {
        const _data = res.data[0].preguntas;
        this.titulo_inicio = _data.inicio;
        this.titulo_fin = _data.fin;
        this.listPreguntas = _data.preguntas;
      }
    });
  }

  private loadOpciones(): void {
    this.crudService.postFree(this.dataPost, 'encuesta', 'las-opciones', false).subscribe( (res: any) => {
      console.log('las opciones', res);
      if ( res.success ) {
        this.listOption = res.data;
      }
    });
  }

}
