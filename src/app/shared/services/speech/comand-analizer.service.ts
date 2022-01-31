import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MozoDialogComponent } from 'src/app/componentes/mozo-virtual/mozo-dialog/mozo-dialog.component';
import { SendDataTTS } from 'src/app/modelos/send.data.tts';
import { CrudHttpService } from '../crud-http.service';
import { InfoTockenService } from '../info-token.service';
import { UtilitariosService } from '../utilitarios.service';
import { SpechTotextService } from './spech-totext.service';
import { SpechTTSService } from './spech-tts.service';
import { SpeechDataProviderService } from './speech-data-provider.service';

@Injectable({
  providedIn: 'root'
})
export class ComandAnalizerService {

  dataListComand: any;
  isMicrophoneOn = false;
  lastCommnad = null;
  lastTextoRecibido = '';
  lastComandOk = '';
  isProcessTalking = false;
  isTalking = false;
  isActive = false;


  private keySotrageCommand = 'sys::cmdv';

  constructor(
    private crudService: CrudHttpService,
    private speechTTService: SpechTTSService,
    private spechTotextService: SpechTotextService,
    private speechDataProviderService: SpeechDataProviderService,
    private infoTokenService: InfoTockenService,
    private dialog: MatDialog,
    private utilitariosService: UtilitariosService
    // private spechProviderConnectService: SpechProviderConnectService,
  ) {
    // this.getComands();

    // ecucha voz to text
    this.spechTotextService.speechTexResponse$.subscribe((data: any) => {
      if ( !data ) {return; }

      // if (data[0].isFinal) {
        // console.log('response', data[0].alternatives[0].transcript);
        const _transcript = data[0].alternatives[0].transcript;
        if ( this.lastComandOk !== '' ) {
          const _compareSimlary = this.utilitariosService.compareSimilaryText(this.lastComandOk, _transcript);
          if ( _compareSimlary >= 0.79 ) {
            return; }
        }

        // console.log('data[0].alternatives[0].transcript', _transcript);
        this.cocinarComand(_transcript);
      // }
    });


    this.speechTTService.isTalking$.subscribe((isTalkin: boolean) => {
      this.isTalking = isTalkin;
      if ( this.isMicrophoneOn ) {
        if ( isTalkin ) {
          this.spechTotextService.stopRecording();
        } else {
          this.spechTotextService.startRecording();
        }
      }
    });

    this.speechDataProviderService.isPedidoEnviado$
    .subscribe((res) => {
      if (res) {
        if ( !this.isMicrophoneOn ) { return; }
        this.isTalking = false;
        this.spechTotextService.stopRecording();
      }
    });

  }

  getIsActive(): boolean {
    return this.isActive;
  }

  setIsActive(val: boolean) {
    this.isActive = val;
  }

  getComands() {
    if (!this.dataListComand) {
      this.crudService.getAll('speech', 'comandos', false, false, false)
      .subscribe((res: any) => {
        // console.log('comandos', res);
        this.dataListComand = res.data;
      });
    } else {
      // console.log('comandos dataListComand', this.dataListComand);
    }
  }


  // ============= VOZ TO TEXT ======= //
  startRecording() {
    this.isMicrophoneOn = true;
    this.spechTotextService.startRecording();
  }

  stopRecording() {
    if ( !this.isMicrophoneOn ) { return; }
    this.isMicrophoneOn = false;
    this.spechTotextService.stopRecording();
  }


  // ============= TTS ======= //
  cocinarComand(comand: string) {
    const _command = this.searchComandList(comand);
    if ( _command ) {
      this.lastCommnad = _command.seccion !== 'inicio' && _command.seccion !== 'finalizar_pedido' && _command.seccion !== 'carta_recomendacion' ? _command : null;
      _command.texto_recibido = comand.replace(this.lastTextoRecibido, '');
      this.analizeCommand(_command);
    }
  }

  // seccion
  searchComandList(comand: string): SendDataTTS {
    let rpt = null;
    comand = comand.toLowerCase();

    if ( !this.dataListComand ) {return; }

    this.dataListComand.map((c: SendDataTTS) => {
      const list = c.comando.split(',');
      const res = list.find(x => {
        const patt = new RegExp(x);
        return patt.test(comand);
      });

      if ( res ) {
        rpt = c;
        rpt.texto_recibido = comand;
        rpt.comando_recibido = res;
      }

    });

    if (!rpt) {
      if ( this.lastCommnad ) {
        this.lastCommnad.texto_recibido = comand;
        rpt = this.lastCommnad;
      }
    }
    return rpt;
  }

  // buscar en text comando, despues de palabra clave o comando principal
  // searchIn array de strig separado por comas
  searchCommandStr(text_command: any, searchIn: any): string {
    let commandSelected = '';

    // descomponer para hacer singular // quitamos las 's'
    // const strSingular = text_command.split(' ').map(x => x.replace(/s$/, '')).join(' ');

    searchIn.map((s: string) => {

      const _similitudCompare = this.utilitariosService.compareSimilaryText(text_command.trim(), s.trim());
      if (_similitudCompare > 0.78) {
        commandSelected = s;
      }
      // console.log('_similitudCompare', _similitudCompare);
      // const regexp = s + '?';
      // let arrayChar = [...text_command.matchAll(regexp) || []];
      // // console.log(regexp, array);
      // if ( arrayChar.length > 0 ) {
      //   commandSelected = s.length > commandSelected.length ? s : commandSelected;
      // } else {
      //   // busca en singular
      //   arrayChar = [...strSingular.matchAll(regexp) || []];
      //   if ( arrayChar.length > 0 ) {
      //     commandSelected = s.length > commandSelected.length ? s : commandSelected;
      //   }
      // }
    });

    return commandSelected;
  }


  private async analizeCommand(comand: SendDataTTS) {
    // let _strComandEqual = this.lastComandOk.toLowerCase().trim();
    // _strComandEqual = _strComandEqual.replace(comand.texto_recibido.toLowerCase().trim(), '');
    // if ( _strComandEqual.trim() === '' ) {return; }
    if ( this.lastComandOk.toLowerCase().trim() === comand.texto_recibido.toLowerCase().trim() ) {return; }
    // this.isProcessTalking = true;

    // await this.utilitariosService.delay(1000);


    // console.log('comand recibido', comand);
    // console.log('this.lastComandOk', this.lastComandOk);

    // si se esta ejecuntando un comando return;
    if ( this.isTalking ) {return; }

    switch (comand.seccion) {
      case 'inicio':
        this.commandIncio(comand);
        break;
      case 'carta':
        this.commandCarta(comand);
        break;
      case 'carta_recomendacion':
        this.commandCartaRecomendacion(comand);
        break;
      case 'navegacion':
        this.commandNavegacion(comand);
        break;
      case 'carta_contenido':
        this.commandCartaContenido(comand);
        break;
      case 'carta_item_suma':
        this.commandCartaItemSuma(comand);
        break;
      case 'carta_item_resta':
        this.commandCartaItemResta(comand);
        break;
      case 'carta_item_resetea':
        this.commandCartaItemResetea(comand);
        break;
      case 'finalizar_pedido':
        this.commandFinalizarPedido(comand);
        break;
      // case 'carta_item_indicaciones':
      //   this.commandCartaItemIndicaciones(comand);
      //   break;
    }
  }

  //// INCIO
  private commandIncio(command: SendDataTTS) {
    switch (command.comando) {
      case 'bienvenido':
        const nomSede = this.speechDataProviderService.getNameSede();
        // console.log('nomSede', nomSede);
        const _isCommandStorage = this.getCommandStorage(command);
        if ( _isCommandStorage ) {
          if ( _isCommandStorage.isTimePlay ) {
            command.text = command.texto_default.text2;
            command.text = command.text.replace('?nomcliente', '');

            // mostrar dialog info
            // this.dialog.open(MozoDialogComponent);
          } else {
            return;
          }
        } else {
          command.text = command.texto_default.text1;
          command.text = command.text.replace('?nomsede', nomSede);
        }

        command.idsede = this.speechDataProviderService.getIdSede();
        // console.log('mensaje de bienvenido', command);
        this.speechVoice(command);

        // mostrar dialog info
        this.dialog.open(MozoDialogComponent);


        break;
    }
  }


  /// CARTA LEER
  private commandCarta(command: SendDataTTS) {
    // leeme, dime, lee, que hay de ...(buscamos en las secciones de la carta)
    const _seccionSeleted = this.getSeccionCarta(command);
    if ( _seccionSeleted.seccion ) {
      const _itemsStr = this.speechDataProviderService.getItemsSeccionSelectedStr(_seccionSeleted.seccion);
      // console.log('itemSeccion', _itemsStr);

      // this.speechDataProviderService.setIsCommandAceptado(1);
      this.isCommandOk(command.texto_recibido, 1);

      const textSend = `De ${_seccionSeleted.nomSeccion}, tenemos: ${_itemsStr}`;
      this.sendTxtToVoice(command, textSend);

      this.speechDataProviderService.goNavegacionSeccionCarta(_seccionSeleted.seccion);
    }

    this.speechDataProviderService.getCarta();
  }

  private commandCartaRecomendacion(command: SendDataTTS) {
    const _itemsStr =  this.speechDataProviderService.getItemsRecomendadosStr();
    if (!_itemsStr ) { // si no existe recomendados
      this.isCommandOk(command.texto_recibido, 1);
      this.sendTxtToVoice(command, command.texto_default.text1);
      return;
    }

    this.isCommandOk(command.texto_recibido, 1);

    const textSend = `Le recomendamos: ${_itemsStr}`;
    this.sendTxtToVoice(command, textSend);

    this.speechDataProviderService.goNavegacionItemRecomendados();
  }

  // CARTA CONTENIDO // lee contenido o detalle de los platos
  private commandCartaContenido(command: SendDataTTS) {
    // console.log('comando carta contenido');
    const _itemSeleted = this.getItemCarta(command);
    if ( _itemSeleted.item ) {
      // console.log('_itemSeleted', _itemSeleted);
      // this.speechDataProviderService.setIsCommandAceptado(1);
      this.isCommandOk(command.texto_recibido, 1);
      const textSend = `${_itemSeleted.nomItem}:. ${_itemSeleted.item.detalles}`;
      this.sendTxtToVoice(command, textSend);
    }
  }

  // CARTA SUMA SUMA
  private commandCartaItemSuma(command: SendDataTTS) {
    // let _command = command.texto_recibido.toLowerCase().replace(command.comando_recibido.toLowerCase(), '');
    // const sa1 = command.texto_recibido.toLowerCase();
    // const sa2 = command.comando_recibido.toLowerCase();
    let _command = this.replaceTextRecibidoComand(command.texto_recibido, command.comando_recibido);

    const rptCant = this.convertTxtToNum(_command);
    // const numCantidad = rptCant?.num || null;
    // _command = _command.replace(rptCant.numStr || '', '').trim();
    // console.log('numCantidad', numCantidad);
    // identifica numero

    if ( rptCant ) {
      const numCantidad = rptCant?.num || null;
      _command = _command.replace(rptCant.numStr || '', '').trim();

      const _itemSeleted = <any>this.getItemCarta(command, _command);
      this.sendItemToPedido(_itemSeleted, numCantidad, true, command);
      // console.log('commandCartaItemSuma', _itemSeleted);
      // this.speechDataProviderService.setIsCommandAceptado(2);
      // for (let index = 0; index < numCantidad; index++) {
      //   // agrega
      //   this.sendItemToPedido(_itemSeleted, true);
      //   // this.speechDataProviderService.addItemPedido(_itemSeleted.item);
      // }

    }
  }

  // CARTA RESTA
  private commandCartaItemResta(command: SendDataTTS) {
    // let _command = command.texto_recibido.toLowerCase().replace(command.comando_recibido.toLowerCase(), '');
    // const sa1 = command.texto_recibido.toLowerCase();
    // const sa2 = command.comando_recibido.toLowerCase();
    let _command = this.replaceTextRecibidoComand(command.texto_recibido, command.comando_recibido);

    const rptCant = this.convertTxtToNum(_command);

    if ( !rptCant ) { return; }
    let numCantidad = rptCant?.num || null;
    _command = _command.replace(rptCant.numStr || '', '');
    // let numCantidad = this.convertTxtToNum(_command);
    // console.log('numCantidad', numCantidad);
    // identifica numero
    const _itemSeleted = <any>this.getItemCarta(command, _command);

    if (!_itemSeleted.item) {return; }
    // si no hay cantidad quita todo
    numCantidad = numCantidad ? numCantidad : _itemSeleted.item.cantidad_seleccionada;
    this.sendItemToPedido(_itemSeleted, numCantidad, false, command);
    // console.log('commandCartaItemResta', _itemSeleted);

    // this.speechDataProviderService.setIsCommandAceptado(1);

  }

  // CARTA RESETEA
  private commandCartaItemResetea(command: SendDataTTS) {
    // let _command = command.texto_recibido.toLowerCase().replace(command.comando_recibido.toLowerCase(), '');
    // const sa1 = command.texto_recibido.toLowerCase();
    // const sa2 = command.comando_recibido.toLowerCase();
    let _command = this.replaceTextRecibidoComand(command.texto_recibido, command.comando_recibido);

    const rptCant = this.convertTxtToNum(_command);
    if ( !rptCant ) { return; }

    const numCantidad = rptCant?.num || null;
    _command = _command.replace(rptCant.numStr || '', '');
    // const numCantidad = this.convertTxtToNum(_command);
    // console.log('numCantidad', numCantidad);
    // identifica numero
    const _itemSeleted = <any>this.getItemCarta(command, _command);

    if (!_itemSeleted.item || !numCantidad) {return; }

    // quita todo
    const _numCantidadItemActual = _itemSeleted.item.cantidad_seleccionada;
    this.sendItemToPedido(_itemSeleted, _numCantidadItemActual, false, command);

    // agrega la nueva cantidad
    this.sendItemToPedido(_itemSeleted, numCantidad, true, command);
    // console.log('commandCartaItemResetea', _itemSeleted);
    // this.speechDataProviderService.setIsCommandAceptado(1);
    this.isCommandOk(command.texto_recibido, 1);

  }

  // CARTA INDICACIONES
  // commandCartaItemIndicaciones(command: SendDataTTS) {
  //   let _command = command.texto_recibido.replace(command.comando_recibido, '');
  //   const _itemSeleted = <any>this.getItemCarta(command);

  //   if (!_itemSeleted.item) {return; }

  //   _command = _command.replace(_itemSeleted.item.des, '');
  //   console.log('_command', _command);
  //   this.speechDataProviderService.setIndicaciones(_itemSeleted.item, _command);
  //   this.isCommandOk(command.texto_recibido, 1);
  // }


  // envia el item al pedido (suma o resta)
  private sendItemToPedido(_itemSeleted, numCantidad, isSuma: boolean, command: SendDataTTS) {
    if (!_itemSeleted.item) {return; }
    // this.speechDataProviderService.setIsCommandAceptado(2);
    this.isCommandOk(command.texto_recibido, 2);
    _itemSeleted.isSuma = isSuma;
    for (let index = 0; index < numCantidad; index++) {
      this.speechDataProviderService.addItemPedido(_itemSeleted);
    }
  }




  // NAVEGACION
  commandNavegacion(command: SendDataTTS) {
    const _seccionSeleted = this.getSeccionCarta(command);
    if ( _seccionSeleted.seccion ) {
      this.speechDataProviderService.goNavegacionSeccionCarta(_seccionSeleted.seccion);
      // this.speechDataProviderService.setIsCommandAceptado(1);
      this.isCommandOk(command.texto_recibido, 1);
    } else {
      // puede ser ver el pedido, reresar

      // mostrar pedido, mi pedido,
      const isShowPedido = command.texto_recibido.indexOf('pedido') > -1;
      if ( isShowPedido ) {
        this.speechDataProviderService.goNavigacionShowMiPedido();
        this.isCommandOk(command.texto_recibido, 1);
      }
      // this.speechDataProviderService.setIsCommandAceptado(1);
      // console.log('navegacion', command);
    }
  }


  // FINALIZAR PEDIDO
  commandFinalizarPedido(command: SendDataTTS) {
  // console.log('command', command);
    if ( this.speechDataProviderService.getIsPedidoValido() ) {
      this.isCommandOk(command.texto_recibido, 1);
      this.speechDataProviderService.goNavigacionShowMiPedido();
      this.speechDataProviderService.setFinalizarPedido(true);

      // chequea que el cliente tenga nombres
      if (this.infoTokenService.getInfoUs().nombres === '') {
        command.text = command.texto_default.text1;
        this.speechVoice(command);
      } else {
        command.text = command.texto_default.text2;
        this.speechVoice(command);
      }
    }
  }


















  private getSeccionCarta(command: SendDataTTS): any {
    // const _command = command.texto_recibido.toLowerCase().replace(command.comando_recibido.toLowerCase(), '');
    // const sa1 = command.texto_recibido.toLowerCase();
    // const sa2 = command.comando_recibido.toLowerCase();
    const _command = this.replaceTextRecibidoComand(command.texto_recibido, command.comando_recibido);
    // buscamos seccion en carta
    const arrSecciones = this.speechDataProviderService.getSeccionesCarta().toLowerCase().split(',');
    const _seccionCarta = this.searchCommandStr(_command, arrSecciones);

    const seccion = _seccionCarta !== '' ? this.speechDataProviderService.getISeccionSelected(_seccionCarta) : null;
    return {
      nomSeccion : _seccionCarta,
      seccion: seccion
    };
  }

  private getItemCarta(command: SendDataTTS, _itemDes: string = null) {
    // const _command = command.texto_recibido.replace(command.comando_recibido, '');
    const _command = _itemDes ? _itemDes : this.replaceTextRecibidoComand(command.texto_recibido, command.comando_recibido);
    const arrItems = this.speechDataProviderService.getItemsCarta().toLowerCase().split(',');
    const _ItemCarta = this.searchCommandStr(_command, arrItems);
    const item = _ItemCarta !== '' ? this.speechDataProviderService.getIItemsSelected(_ItemCarta) : null;
    return {
      nomItem : _ItemCarta,
      item: item
    };
  }

  private convertTxtToNum(command: string): any {
    let num = null;
    const _strNum = 'uno,dos,tres,cuatro,cinco,seis,siete,ocho,nueve,diez,once,doce,trece,catorce,quince,dieciseis,diecisiete,diecisiete,dieciocho,diecinueve,veinte,veintiuno,veintidos,veintitres,veinticuatro,veinticinco';
    const _strOtherOne = 'otro,un,una';
    const _intNum = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30';
    let numStr = '';

    command = ' ' + command;

    // 1) econtar entero en cadena
    const numRpt = command.match(/\d+/);
    num = numRpt ? numRpt[0] : null;
    if ( !num ) {

      // 2) busca descripcion del numero en cadena
      num = _strNum.split(',').findIndex(c => command.match(' ' + c + ' ')) + 1;
      numStr = _strNum.split(',')[num - 1];

      if ( num === 0 ) { // no encontro
        // 3) buscamos en _strOtherOne
        num = _strOtherOne.split(',').findIndex(c => command.match(' ' + c + ' '));
        numStr = _strOtherOne.split(',')[num];
        num = num ? 1 : null;
      }

      // console.log('num1', num);
    }

    return num ? {num: num, numStr: numStr} : null;

    // return num ? num : null;


    // const patt = new RegExp(_strNum);
    // numRpt = patt.test(command);
  }

  private replaceTextRecibidoComand(texto_recibido: string, comando_recibido: string): string {
    const sa1 = texto_recibido.toLowerCase();
    const sa2 = comando_recibido.toLowerCase();
    return sa1.replace(sa2, '').trim();
  }

  private sendTxtToVoice(commandSend: SendDataTTS, text: string) {


    if ( this.isProcessTalking ) { return; }
    this.isProcessTalking = true;

    commandSend.idsede = 1;
    commandSend.text = text;

    // console.log('commandSend', commandSend);
    this.speechTTService.convertTxtToVoice(commandSend);

    setTimeout(() => { this.isProcessTalking = false; }, 1000);
  }


  private isCommandOk(command: string, numberBeep: number) {
    this.lastComandOk = command;
    this.speechDataProviderService.setIsCommandAceptado(numberBeep);

    setTimeout(() => { this.lastComandOk = ''; }, 1000);
  }

















  private speechVoice(command: SendDataTTS) {
    this.speechTTService.convertTxtToVoice(command);
  }

  private getCommandStorage(command: SendDataTTS): any {
    let commandResponse = null;
    const cmdStorage = localStorage.getItem(this.keySotrageCommand);
    const cmdStorageList = cmdStorage ? JSON.parse(cmdStorage) : null;
    if ( cmdStorageList ) {
      commandResponse = cmdStorageList.filter(x => x.idcomando_voz === command.idcomando_voz)[0] || null;
      if ( !commandResponse ) {
        this.saveCommandStorage(command);
      } else {
        // si existe en storage verifica el tiempparse
        const minDiffCommand = this.diffMinTimeComandStorage(commandResponse);
        commandResponse.isTimePlay = minDiffCommand > 15;

        if ( commandResponse.isTimePlay ) {
          commandResponse.time = new Date().toISOString();
          localStorage.setItem(this.keySotrageCommand, JSON.stringify(cmdStorageList));
        }
      }
    } else {
      this.saveCommandStorage(command);
    }

    return commandResponse;
  }

  private saveCommandStorage(command: SendDataTTS) {
    const cmdStorage = localStorage.getItem(this.keySotrageCommand);
    const cmdStorageList = cmdStorage ? JSON.parse(cmdStorage) : [];
    const _newRowStorage = {idcomando_voz: command.idcomando_voz, time: new Date().toISOString()};
    cmdStorageList.push(_newRowStorage);

    localStorage.setItem(this.keySotrageCommand, JSON.stringify(cmdStorageList));
  }

  private diffMinTimeComandStorage(commandStorage: any) {
    const _dateCommand = new Date(commandStorage.time);
    const _dateNow = new Date();
    const diff = Math.abs(<any>_dateCommand - <any>_dateNow);
    // const minutes = Math.floor((diff / 1000) / 60);
    return Math.floor((diff / 1000) / 60);
  }


}
