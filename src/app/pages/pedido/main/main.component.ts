import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  isVisibleToolBar = true;

  private lastValScrollTop = 0;

  constructor() { }

  ngOnInit() {
  }

  onScroll($event: any): void {
    const val = $event.srcElement.scrollTop;
    this.isVisibleToolBar = val >= this.lastValScrollTop && val > 54 ? false : true;

    setTimeout(() => {
      this.lastValScrollTop = val;
    }, 100);
  }
}
