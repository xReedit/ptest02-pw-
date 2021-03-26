import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ListenStatusService } from 'src/app/shared/services/listen-status.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  numberShowPageAtm = 0;

  constructor(
    private router: Router,
    private listenService: ListenStatusService
    ) { }

  ngOnInit(): void {

    this.listenService.numberPageShowAtm$.subscribe(res => {
      console.log('from main showpage', res);
      this.numberShowPageAtm = res;
    });
  }

  goBack() {
    --this.numberShowPageAtm;
    if ( this.numberShowPageAtm < 0 ) {
      this.router.navigate(['../']);
    }

    this.numberShowPageAtm = this.numberShowPageAtm < 0 ? 0 : this.numberShowPageAtm;
    this.listenService.setNumberShowPageAtm(this.numberShowPageAtm);
  }

}
