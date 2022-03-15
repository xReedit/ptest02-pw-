// este servicio arma el json, que se envia para imprmir // print_setver_detalle

import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { MipedidoService } from './mipedido.service';
import { TipoConsumoModel } from 'src/app/modelos/tipoconsumo.model';
import { SeccionModel } from 'src/app/modelos/seccion.model';
import { ItemModel } from 'src/app/modelos/item.model';
import { PedidoModel } from 'src/app/modelos/pedido.model';

@Injectable({
  providedIn: 'root'
})
export class JsonPrintService {
  datosSede: any = [];

  private impresoras: any = [];


  constructor(
    private socketService: SocketService,
    private pedidoService: MipedidoService
    ) {



  }

  // obtener los datos de la sede
  private getDataSede(): void {
    // this.socketService.onGetDatosSede().subscribe((res: any) => {
      // this.datosSede = res[0];
      this.datosSede = this.pedidoService.objDatosSede;
      // console.log('datos de la sede', this.datosSede);
    // });
  }

  // relacionar secciones con impresoras
  private relationRowToPrint(iscliente: boolean = false): void {

    // datos de la sede
    this.getDataSede();


    const _objMiPedido = this.pedidoService.getMiPedido();
    const xRptPrint: any = []; // respuesta para enviar al backend
    const listOnlyPrinters: any = []; // lista de solo impresoras
    let xImpresoraPrint: any = []; // array de impresoras
    let xArrayBodyPrint: any = []; // el array de secciones e items a imprimir
    let printerAsigando: any = null;

    this.impresoras = <any[]>this.datosSede.impresoras;
    // valores de la primera impresora // impresora donde se pone el logo
    const num_copias_all = this.datosSede.datossede[0].num_copias; // numero de copias para las demas impresoras -local
    const var_size_font_tall_comanda = this.datosSede.datossede[0].var_size_font_tall_comanda; // tamañao de letras
    const pie_pagina = this.datosSede.datossede[0].pie_pagina;
    const pie_pagina_comprobante = this.datosSede.datossede[0].pie_pagina_comprobante;
    const isPrintPedidoDeliveryCompleto = this.datosSede.datossede[0].isprint_all_delivery.toString() === '1';
    let isHayDatosPrintObj = true; // si hay datos en el obj xArrayBodyPrint para imprimir
    let isPedidoDelivery = false;
    // let indexP = 0;

    // si es cliente asigna impresora a seccion sin impresora // ej delivery por aplicacion
    if ( iscliente ) {
      this.setFirstPrinterSeccionCliente( _objMiPedido,  this.impresoras);
    }

    // si es punto auto pedido agregamos la impresora asignada
    const _puntoConfig = JSON.parse(localStorage.getItem('sys::punto')) || {};
    _puntoConfig.ispunto_autopedido = _puntoConfig ? _puntoConfig.ispunto_autopedido : false;

    this.impresoras.map((p: any) => {
      isHayDatosPrintObj = false;
      xArrayBodyPrint = [];


      _objMiPedido.tipoconsumo
        .map((tpc: TipoConsumoModel, indexP: number) => {
          xArrayBodyPrint[indexP] = { 'des': tpc.descripcion, 'id': tpc.idtipo_consumo, 'titlo': tpc.titulo, 'conDatos': false};
          isPedidoDelivery = tpc.descripcion.toLowerCase() === 'delivery';

          tpc.secciones
            .filter((s: SeccionModel) => s.idimpresora === p.idimpresora)
            .map((s: SeccionModel) => {
              printerAsigando = p;

              // imprime todo el pedido en todas las areas si es delivery
              if (isPedidoDelivery && isPrintPedidoDeliveryCompleto) {
                tpc.secciones.map((seccion: SeccionModel) => {
                  seccion.items.map((i: ItemModel) => {
                    isHayDatosPrintObj = true;
                    xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                    xArrayBodyPrint[indexP][i.iditem] = i;
                    xArrayBodyPrint[indexP][i.iditem].des_seccion = seccion.des;
                    xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                    xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                    if ( !i.subitems_view ) {
                      xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                    }
                  });
                });
              }

              s.items.map((i: ItemModel) => {
                if (i.imprimir_comanda === 0 && !iscliente) { return; } // no imprimir // productos bodega u otros
                  // xArrayBodyPrint[indexP][i.iditem] = [];
                  isHayDatosPrintObj = true;
                  xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                  xArrayBodyPrint[indexP][i.iditem] = i;
                  xArrayBodyPrint[indexP][i.iditem].des_seccion = s.des;
                  xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                  xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                  if ( !i.subitems_view ) {
                    xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                  }
                });
              });

            // otra impresora en seccion
            tpc.secciones
            .filter((s: SeccionModel) => s.idimpresora_otro === p.idimpresora)
            .map((s: SeccionModel) => {
              printerAsigando = p;

              // imprime todo el pedido en todas las areas si es delivery
              if (isPedidoDelivery && isPrintPedidoDeliveryCompleto) {
                tpc.secciones.map((seccion: SeccionModel) => {
                  seccion.items.map((i: ItemModel) => {
                    isHayDatosPrintObj = true;
                    xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                    xArrayBodyPrint[indexP][i.iditem] = i;
                    xArrayBodyPrint[indexP][i.iditem].des_seccion = seccion.des;
                    xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                    xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                    if ( !i.subitems_view ) {
                      xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                    }
                  });
                });
              }

              s.items.map((i: ItemModel) => {
                if (i.imprimir_comanda === 0 && !iscliente) { return; } // no imprimir // productos bodega u otros
                  // xArrayBodyPrint[indexP][i.iditem] = [];
                  isHayDatosPrintObj = true;
                  xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                  xArrayBodyPrint[indexP][i.iditem] = i;
                  xArrayBodyPrint[indexP][i.iditem].des_seccion = s.des;
                  xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                  xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                  if ( !i.subitems_view ) {
                    xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                  }
                });
              });
              // indexP++;


              // si es punto autopedido
              if ( _puntoConfig.ispunto_autopedido ) {
                _puntoConfig.impresora.ip_print = _puntoConfig.impresora.ip;

                if ( p.idimpresora !== _puntoConfig.impresora.idimpresora ) { return; }

                tpc.secciones
                // .filter((s: SeccionModel) => s.idimpresora === p.idimpresora)
                .map((s: SeccionModel) => {
                  printerAsigando = _puntoConfig.impresora;

                  s.items.map((i: ItemModel) => {
                    if (i.imprimir_comanda === 0 && !iscliente) { return; } // no imprimir // productos bodega u otros
                      // xArrayBodyPrint[indexP][i.iditem] = [];
                      isHayDatosPrintObj = true;
                      xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                      xArrayBodyPrint[indexP][i.iditem] = i;
                      xArrayBodyPrint[indexP][i.iditem].des_seccion = s.des;
                      xArrayBodyPrint[indexP][i.iditem].cantidad = i.cantidad_seleccionada.toString().padStart(2, '0');
                      xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(i.precio_print.toString()).toFixed(2);
                      if ( !i.subitems_view ) {
                        xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                      }
                    });
                  });
              }

          });


      if (xArrayBodyPrint.length === 0 || !isHayDatosPrintObj) { return; }

      xImpresoraPrint = [];
      const childPrinter: any = {};
      childPrinter.ip_print = printerAsigando.ip;
      childPrinter.var_margen_iz = printerAsigando.var_margen_iz;
      childPrinter.var_size_font = printerAsigando.var_size_font;
      childPrinter.local = 0;
      childPrinter.num_copias = num_copias_all;
      childPrinter.var_size_font_tall_comanda = var_size_font_tall_comanda;
      childPrinter.copia_local = 0; // no imprime // solo para impresora local
      childPrinter.img64 = '';
      childPrinter.papel_size = printerAsigando.papel_size;
      childPrinter.pie_pagina = pie_pagina;
      childPrinter.pie_pagina_comprobante = pie_pagina_comprobante;

      xImpresoraPrint.push(childPrinter);

      // console.log('xArrayBodyPrint', xArrayBodyPrint);
      // console.log('xImpresoraPrint', xImpresoraPrint);
      xRptPrint.push({
        arrBodyPrint: xArrayBodyPrint,
        arrPrinters: xImpresoraPrint
      });

      listOnlyPrinters.push(childPrinter);
    });


    xRptPrint.listPrinters = listOnlyPrinters;

    return xRptPrint;



  }

  // recuepra la primera impresora para imprimir cuando manda el cliente y si la seccion no tiene impresora
  private GetFirstPrinter(listPrinter: any): any {
    let firtsPrinter: any = null;
    const countPrinters = listPrinter.length;
    if ( countPrinters > 0 ) {
        firtsPrinter = listPrinter[0];
    }

    if ( countPrinters > 1 && firtsPrinter.descripcion.toLowerCase() === 'caja' ) {
      firtsPrinter = listPrinter[1];
    }

    return firtsPrinter;
  }

  // asigna impresora a las seccion que no tienen // para cuando el cliente realize el pedido imprima
  private setFirstPrinterSeccionCliente(_objMiPedido: PedidoModel, listPrinter: any) {
    let firtsIdPrinter: any = {};
    _objMiPedido.tipoconsumo
        .map((tpc: TipoConsumoModel) => {
          firtsIdPrinter = tpc.secciones.filter((s: SeccionModel) => s.idimpresora !== 0)[0];
          if ( firtsIdPrinter ) { return; }
        });

      // sino encontro ningun impresora asigna impresora de la lista de impresoras
      if ( !firtsIdPrinter ) {
        firtsIdPrinter = this.GetFirstPrinter(listPrinter);
      }

      if ( !firtsIdPrinter ) { return; }

    // asignamos a las secciones que no tienen impresora
    _objMiPedido.tipoconsumo
        .map((tpc: TipoConsumoModel, indexP: number) => {
          firtsIdPrinter = tpc.secciones.filter((s: SeccionModel) => s.idimpresora === 0)
          .map((s: SeccionModel) => { s.idimpresora = firtsIdPrinter.idimpresora; });
        });
  }

  getPrinterPrecuenta() {
    let xRptPrint: any; // respuesta para enviar al backend
    let xImpresoraPrint: any = []; // array de impresoras
    let xArrayBodyPrint: any = []; // el array de secciones e items a imprimir

    // datos de la sede
    this.getDataSede();

    // console.log('print precuenta');

    xImpresoraPrint = [];
    const var_size_font_tall_comanda = this.datosSede.datossede[0].var_size_font_tall_comanda; // tamañao de letras
    const pie_pagina = this.datosSede.datossede[0].pie_pagina;
    const pie_pagina_comprobante = this.datosSede.datossede[0].pie_pagina_comprobante;

    // formato imprimir
    const _objMiPedido = this.pedidoService.getMiPedido();
    xArrayBodyPrint = [];
      _objMiPedido.tipoconsumo
        .map((tpc: TipoConsumoModel, indexP: number) => {
          xArrayBodyPrint[indexP] = { 'des': tpc.descripcion, 'id': tpc.idtipo_consumo, 'titlo': tpc.titulo, 'conDatos': false};
          tpc.secciones
            .map((s: SeccionModel) => {
              s.items.map((i: ItemModel) => {
                // if (i.imprimir_comanda === 0) { return; } // no imprimir // productos bodega u otros
                  // xArrayBodyPrint[indexP][i.iditem] = [];
                  xArrayBodyPrint[indexP].conDatos = true; // si la seccion tiene items
                  xArrayBodyPrint[indexP][i.iditem] = xArrayBodyPrint[indexP][i.iditem] ? xArrayBodyPrint[indexP][i.iditem] : i;
                  xArrayBodyPrint[indexP][i.iditem].des_seccion = s.des;
                  xArrayBodyPrint[indexP][i.iditem].cantidad = xArrayBodyPrint[indexP][i.iditem].cantidad ? xArrayBodyPrint[indexP][i.iditem].cantidad : 0;
                  xArrayBodyPrint[indexP][i.iditem].precio_print_app = xArrayBodyPrint[indexP][i.iditem].precio_print_app ? xArrayBodyPrint[indexP][i.iditem].precio_print_app : 0;
                  xArrayBodyPrint[indexP][i.iditem].cantidad += parseFloat(i.cantidad_seleccionada.toString()); // .toString().padStart(2, '0');
                  xArrayBodyPrint[indexP][i.iditem].precio_print_app += parseFloat(i.precio_print.toString());
                  xArrayBodyPrint[indexP][i.iditem].precio_print = parseFloat(xArrayBodyPrint[indexP][i.iditem].precio_print_app.toString()).toFixed(2);
                  if ( !i.subitems_view ) {
                    xArrayBodyPrint[indexP][i.iditem].subitems_view = null;
                  }
                });
              });
              // indexP++;
          });

    this.impresoras = <any[]>this.datosSede.impresoras;
    const p = this.impresoras.filter(x => x.idtipo_otro).filter(x => x.idtipo_otro.indexOf('-2') > -1)[0];
    if ( !p ) {return false; }
    const childPrinter: any = {};
      childPrinter.ip_print = p.ip;
      childPrinter.var_margen_iz = p.var_margen_iz;
      childPrinter.var_size_font = p.var_size_font;
      childPrinter.local = 0;
      childPrinter.num_copias = 0;
      childPrinter.var_size_font_tall_comanda = var_size_font_tall_comanda;
      childPrinter.copia_local = 0; // no imprime // solo para impresora local
      childPrinter.img64 = '';
      childPrinter.papel_size = p.papel_size;
      childPrinter.pie_pagina = pie_pagina;
      childPrinter.pie_pagina_comprobante = pie_pagina_comprobante;
    xImpresoraPrint.push(childPrinter);

    // buscar impresora de precuenta

    xRptPrint = {
      arrBodyPrint: xArrayBodyPrint,
      arrPrinters: xImpresoraPrint
    };

    return xRptPrint;
  }

  enviarMiPedido(iscliente: boolean = false): any {
    return this.relationRowToPrint(iscliente);
  }

}
