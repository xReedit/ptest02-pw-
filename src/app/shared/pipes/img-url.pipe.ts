import { Pipe, PipeTransform } from '@angular/core';
import { URL_IMG_CARTA, URL_IMG_COMERCIO, URL_IMG_ICONS, URL_IMG_PROMO } from '../config/config.const';
import { urlImagen } from '../utils/img-url';

export type TipoImagen = 'carta' | 'promo' | 'comercio' | 'iconos';

const BASES: { [tipo in TipoImagen]: string } = {
  carta: URL_IMG_CARTA,
  promo: URL_IMG_PROMO,
  comercio: URL_IMG_COMERCIO,
  iconos: URL_IMG_ICONS
};

@Pipe({
  name: 'imgUrl'
})
export class ImgUrlPipe implements PipeTransform {
  transform(nombre: string | null | undefined, tipo: TipoImagen): string {
    return urlImagen(BASES[tipo], nombre);
  }
}
