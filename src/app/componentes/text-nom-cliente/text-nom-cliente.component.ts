import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuarioTokenModel } from 'src/app/modelos/usuario.token.model';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';

@Component({
  selector: 'app-text-nom-cliente',
  templateUrl: './text-nom-cliente.component.html',
  styleUrls: ['./text-nom-cliente.component.css']
})
export class TextNomClienteComponent implements OnInit {

  @Input() sizeTextBg: boolean;
  @Output() isNombreValid = new EventEmitter<boolean>();

  infoCliente: UsuarioTokenModel;
  isValidNombre = false;
  nombreCliente: string;
  constructor(
    private infoTokenService: InfoTockenService,
  ) { }

  ngOnInit(): void {
    this.infoCliente = this.infoTokenService.getInfoUs();
    this.nombreCliente = this.infoCliente.nombres;

    this.saveNomCliente(this.nombreCliente);

    // this.isValidNombre = this.nombreCliente !== '';
    // this.isNombreValid.emit(this.isValidNombre);
    // console.log('this.infoCliente txt nombre', this.infoCliente);
  }

  saveNomCliente(value: string) {
    value = value.toLocaleLowerCase().indexOf('invitado') > -1 ? '' : value;
    this.infoTokenService.setNombres(value);
    this.infoCliente = this.infoTokenService.getInfoUs();
    this.nombreCliente = this.infoCliente.nombres;
    this.isValidNombre = this.nombreCliente !== '';
    this.isNombreValid.emit(this.isValidNombre);
    // console.log('this.infoCliente txt nombre A', this.infoCliente);
  }

}
