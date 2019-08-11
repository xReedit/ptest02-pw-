import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ScrollToolBarService {

  constructor() {
  }

  listenScroll() {
    return fromEvent(window, 'scroll');
  }

}
