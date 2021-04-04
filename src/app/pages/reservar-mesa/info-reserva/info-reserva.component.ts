import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-info-reserva',
  templateUrl: './info-reserva.component.html',
  styleUrls: ['./info-reserva.component.css']
})
export class InfoReservaComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  btnNext() {
    this.router.navigate(['/reservar-mesa/lista-comercios-reserva']);
  }

}
