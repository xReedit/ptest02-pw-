import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { CrudHttpService } from 'src/app/shared/services/crud-http.service';
import { NavigatorLinkService } from 'src/app/shared/services/navigator-link.service';
import { MipedidoService } from 'src/app/shared/services/mipedido.service';
// import { throwMatDialogContentAlreadyAttachedError } from '@angular/material/dialog';
import { SocketService } from 'src/app/shared/services/socket.service';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';
import { DeliveryEstablecimiento } from 'src/app/modelos/delivery.establecimiento';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit   {
  nomSede = '';
  ciudadSede = '';
  infoToken: UsuarioTokenModel;
  titulo_inicio: '';
  titulo_fin: '';
  listPreguntas: any;
  listOption: any;
  countFin = 4;

  selectedTabEncuesta = 0;

  private intervalConteo = null;
  private isBtnPagoShow = false; // si el boton de pago ha sido visible entonces recarga la pagina de pago

  private dataPost: any;
  private ListRespuestas: any = [];
  private xIdEncuesta = 0;
  private countOption = 1; // inicio y fin

  private infoSede: DeliveryEstablecimiento;

  constructor(
    private infoTokenService: InfoTockenService,
    private crudService: CrudHttpService,
    private navigatorService: NavigatorLinkService,
    private socketService: SocketService,
    private listenStatusService: ListenStatusService,
    private establecimientoService: EstablecimientoService
  ) { }

  ngOnInit() {
    this.infoToken = this.infoTokenService.getInfoUs();
    // console.log(this.infoToken);
    // this.nomSede = localStorage.getItem('sys::s').split('|');
    this.infoSede = this.establecimientoService.get();
    this.nomSede = this.infoSede.nombre;
    this.ciudadSede = this.infoSede.ciudad;

    this.dataPost = {
      idsede: this.infoSede.idsede,
      // idsede: this.infoToken.idsede,
      // idcliente: this.infoTokenService.getInfoUs().idcliente
    };

    this.loadOpciones();

    this.loadEncuesta();

    // deshabilitar boton back navegator
    this.navigatorService.disabledBack = true;
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
        history.go(1);
    };

    // escucha si bnPago show para reload
    this.listenStatusService.isBtnPagoShow$.subscribe((res: boolean) => { this.isBtnPagoShow = res; });
  }

  private loadEncuesta(): void {

    this.crudService.postFree(this.dataPost, 'encuesta', 'la-encuesta', false).subscribe( (res: any) => {
      // console.log(res);
      if ( res.success ) {
        if ( res.data.length === 0 ) {
          this.cerrarSession();
          return;
        }
        const _data = res.data[0].preguntas;
        this.xIdEncuesta = _data.idencuesta;
        this.titulo_inicio = _data.inicio;
        this.titulo_fin = _data.fin;
        this.listPreguntas = _data.preguntas;

        this.countOption += this.listPreguntas.length;
      } else {
        this.cerrarSession();
      }
    });
  }

  private loadOpciones(): void {
    this.crudService.postFree(this.dataPost, 'encuesta', 'las-opciones', false).subscribe( (res: any) => {

      if ( res.success ) {
        this.listOption = res.data;
      }



    });
  }

  pasarTab(event: any = null, pregunta: any = null, txt_comentario: string = null) {


    if ( !event ) { this.selectedTabEncuesta ++; return; } // inicio

    const isComentario = pregunta.obligatorio === '1' ? true : false;

    const rpt = {
      idencuesta_pregunta: pregunta.idencuesta_pregunta,
      idencuesta_respuesta: event.idencuesta_respuesta || 0,
      iscomentario: isComentario,
      comentario: txt_comentario || ''
    };

    this.ListRespuestas.push(rpt);



    this.selectedTabEncuesta ++;

    if ( isComentario ) {
      this.guardarEncuesta();
    }



    if ( this.countOption === this.selectedTabEncuesta ) {

      this.cuentaRegresiva();
    }
  }

  private guardarEncuesta(): void {
    const _dataSend = {item: this.ListRespuestas, i: this.xIdEncuesta };
    this.crudService.postFree(_dataSend, 'encuesta', 'guardar', false).subscribe( (res: any) => {

    });
  }

  private cuentaRegresiva() {
    if ( this.countFin <= 0 ) {
      this.intervalConteo = null;
      this.cerrarSession();
    } else {
      this.conteoFinEncuesta();
    }
  }

  private conteoFinEncuesta(): void {
    this.intervalConteo =  setTimeout(() => {
      this.countFin --;
      this.cuentaRegresiva();
    }, 1000);
  }

  private cerrarSession(): void {
    this.navigatorService.cerrarSession(this.isBtnPagoShow);
    // this.miPedidoService.cerrarSession();
    this.infoTokenService.cerrarSession();

    // para cargar nuevamente al ingresar
    this.socketService.isSocketOpenReconect = true;
    this.socketService.closeConnection();
  }

}
