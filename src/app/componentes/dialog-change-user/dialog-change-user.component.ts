import { Component, OnInit } from '@angular/core';
import {CrudHttpService} from '../../shared/services/crud-http.service';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';
import { AuthServiceSotrage } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'dialog-change-user.',
  templateUrl: './dialog-change-user.component.html',
  styleUrls: ['./dialog-change-user.component.css']
})
export class DialogChangeUser implements OnInit {
    nomUsuarioChange: any = {};
    claveUsuarioChange: string;
    listUsuarios: any = [];
    usuario = new UsuarioAutorizadoModel();
    isShowPassword = false;
    rippleColor = 'rgb(255,238,88, 0.5)';

    numberPassword = '';
    rptNoSuccess = '';
    loading = false;

    constructor(
        private crudService: CrudHttpService,
        private authService: AuthServiceSotrage,
        private infoToken: InfoTockenService,
        private dialogRef: MatDialogRef<DialogChangeUser>
    ) { }

    ngOnInit(): void {
        this.loadMozos();
    }

    changeUser() {

    }

    async loadMozos() {
        this.listUsuarios = this.getSotrageListMozos();
        if ( this.listUsuarios.length > 0 ) { return; }
        this.crudService.getAll('pedido', 'get-user-mozo-change-user', false, false)
            .subscribe((res: any) => {
                console.log(res);
                this.listUsuarios = res.data;
                this.saveStorageListMozos();
            });
    }

    saveStorageListMozos() {
        localStorage.setItem('sys::list-mozos', JSON.stringify(this.listUsuarios));        
    }

    getSotrageListMozos() {
        const listMozos = JSON.parse(localStorage.getItem('sys::list-mozos'));        
        return listMozos ? listMozos : [];
    }

    selectUser(user: any) {
        this.rptNoSuccess = '';
        this.loading = false;
        this.nomUsuarioChange = user
        this.isShowPassword = true;
    }

    writeNumber(num: string) {
        this.numberPassword = num;
    }

    runChangeUser(pass: string) {
        this.rptNoSuccess = '';        
        this.claveUsuarioChange = pass;
        this.changeLoginUser();

    }

    changeLoginUser() {
        if ( this.loading ) {return; }

        this.loading = true;
        this.usuario.nomusuario = this.nomUsuarioChange.usuario;
        this.usuario.pass = this.claveUsuarioChange;
        this.authService.getUserLogged(this.usuario).subscribe(res => {
            console.log('res', res);
            if (res.success) {
                this.authService.setLocalToken(res.token);
                this.authService.setLocalTokenAuth(res.token);
                this.authService.setLoggedStatus(true);
                this.authService.setLocalUsuario(this.usuario);
                this.infoToken.changeUserMozo(this.nomUsuarioChange);
                this.infoToken.setIsUsuarioAutorizacion(true);
                // this.infoToken.converToJSON();
                this.dialogRef.close(this.nomUsuarioChange);
                this.loading = false;
            } else {
                this.rptNoSuccess = res.error;
                this.loading = false;
            }
        });
    }

}