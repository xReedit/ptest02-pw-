import { URL_IMG_CARTA, URL_IMG_COMERCIO, URL_IMG_ICONS, URL_IMG_PROMO } from '../config/config.const';
import { urlImagen } from '../utils/img-url';
import { ImgUrlPipe } from './img-url.pipe';

describe('ImgUrlPipe', () => {
  const pipe = new ImgUrlPipe();

  it('mapea cada tipo a su base del environment', () => {
    expect(pipe.transform('plato.png', 'carta')).toBe(urlImagen(URL_IMG_CARTA, 'plato.png'));
    expect(pipe.transform('promo.png', 'promo')).toBe(urlImagen(URL_IMG_PROMO, 'promo.png'));
    expect(pipe.transform('logo.png', 'comercio')).toBe(urlImagen(URL_IMG_COMERCIO, 'logo.png'));
    expect(pipe.transform('yape.png', 'iconos')).toBe(urlImagen(URL_IMG_ICONS, 'yape.png'));
  });

  it('devuelve cadena vacia si no hay nombre', () => {
    expect(pipe.transform('', 'carta')).toBe('');
    expect(pipe.transform(null, 'comercio')).toBe('');
  });

  it('no vuelve a prefijar una URL ya armada', () => {
    const ya = pipe.transform('logo.png', 'comercio');
    expect(pipe.transform(ya, 'comercio')).toBe(ya);
  });
});
