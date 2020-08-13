import { Component, OnInit } from '@angular/core';
import { UsuarioAutorizadoModel } from 'src/app/modelos/usuario-autorizado.model';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { InfoTockenService } from 'src/app/shared/services/info-token.service';
import { EstablecimientoService } from 'src/app/shared/services/establecimiento.service';

@Component({
  selector: 'app-login-personal-autorizado',
  templateUrl: './login-personal-autorizado.component.html',
  styleUrls: ['./login-personal-autorizado.component.css']
})
export class LoginPersonalAutorizadoComponent implements OnInit {

  usuario: UsuarioAutorizadoModel;
  loading = false;
  msjErr = false;

  constructor(private router: Router, private authService: AuthService, private infoToken: InfoTockenService, private establecimientoService: EstablecimientoService) { }

  ngOnInit() {
    localStorage.clear();
    this.usuario = new UsuarioAutorizadoModel();
  }

  logear(): void {
    this.loading = true;
    this.msjErr = false;

    this.authService.setLocalToken('');
    this.authService.getUserLogged(this.usuario).subscribe(res => {
      setTimeout(() => {
        if (res.success) {
          this.authService.setLocalToken(res.token);
          this.authService.setLocalTokenAuth(res.token);
          this.authService.setLoggedStatus(true);
          this.authService.setLocalUsuario(this.usuario);
          this.infoToken.converToJSON();
          this.loadDataEstablecimiento(res.usuario.idsede);
          this.router.navigate(['./pedido']);
          // this.loading = false;
        } else {
          this.loading = false;
          this.msjErr = true;
        }
      }, 2000);
    });
  }


  private loadDataEstablecimiento(id: number) {
    this.establecimientoService.loadEstablecimientoById(id);
  }

}
