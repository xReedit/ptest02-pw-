import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  private _comercioUrl = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  async ngOnInit() {
    // solo para url carta delivery
    const nomsede = this.activatedRoute.snapshot.params.nomsede;
    

    if ( nomsede ) {
      this.router.navigate(['/redirec', nomsede]);
    } else {

      // this._comercioUrl = this.activatedRoute.snapshot.queryParamMap.get('co');
      this._comercioUrl = this.activatedRoute.snapshot.fragment;
      if ( !this._comercioUrl ) {return; }
      const numChar = this._comercioUrl.indexOf('?co=') + 4;


      if ( numChar > 4 ) {
        this._comercioUrl = this._comercioUrl.substring(numChar);
        const courl = 'co:' + this._comercioUrl;

        // this.router.navigate(['/lector-qr'], { queryParams: {'co' : this._comercioUrl} });
        this.router.navigate(['/redirec', courl]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
