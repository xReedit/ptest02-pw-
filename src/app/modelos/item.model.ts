import { TipoConsumoModel } from './tipoconsumo.model';

export class ItemModel {
    iditem: number;
    idseccion: number;
    idcarta_lista: number;
    isalmacen: number;
    precio: string;
    cantidad: number;
    cantidad_seleccionada: number;
    cantidad_reset: number; // cuando caduca el tiempo y recupera stock
    des: string;
    selected: boolean;
    _tiposconsumo: TipoConsumoModel[] = []; // solo frond end
}
