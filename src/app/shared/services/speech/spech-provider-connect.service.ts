import { Injectable, EventEmitter, Output } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { URL_SERVER_SOCKET_SPEECH } from '../../config/config.const';

@Injectable({
  providedIn: 'root'
})
export class SpechProviderConnectService extends Socket {
  // export class SpechProviderConnectService  {

  @Output() speechDataEvent: EventEmitter<any> = new EventEmitter();
  @Output() ttsDataEvent: EventEmitter<any> = new EventEmitter();

  constructor() {

    super({ url: URL_SERVER_SOCKET_SPEECH, options: {path: '/socket.io.speech'} });

    this.ioSocket.on('speechData', (data) => {
      this.speechDataEvent.emit(data);
    });

    this.ioSocket.on('speechDataTTS', (data) => {
      this.ttsDataEvent.emit(data);
    });

    this.ioSocket.on('messages', (data) => {
      console.log(data);
    });

    this.ioSocket.on('connect', () => {console.log('conectadoooo a speech'); });
  }

  // connectar() {
  //   this.ioSocket.on('connect', () => {console.log('conectadoooo a speech'); });
  // }

  emitEvent = (event = 'default', payload = {}) => {
    this.ioSocket.emit(event, payload);
  }

  // temporal
  // emit(a: string, payload: any) {

  // }
}
