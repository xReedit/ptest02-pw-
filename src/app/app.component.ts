import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
// import { ActivatedRoute } from '@angular/router';
// import { App } from '@capacitor/app';
// import { Auth0Service } from './shared/services/auth0.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // title = 'pwa-app-pedido';

  suscribe: any;
  constructor(
    private swUpdate: SwUpdate
    // private auth: Auth0Service
    // public plataform: Plataform
    // private activatedRoute: ActivatedRoute
  ) {

    // const nomsede = this.activatedRoute.snapshot.params.nomsede;
    // console.log('parametro url', nomsede); // OUTPUT 1534
    // this.suscribe = this.plataform.

    // App.addListener('backButton', () => {
    //   // App.exitApp();
    //   console.log('boton atras app');
    // });

  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
          console.log('nueva version');
          window.location.reload();
      });
    }
  }
}
