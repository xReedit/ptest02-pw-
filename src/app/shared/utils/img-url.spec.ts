import { urlImagen } from './img-url';

describe('urlImagen', () => {

  it('une base y nombre dejando exactamente un /', () => {
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo', 'sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', '/sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo//', '//sede-10.png'))
      .toBe('https://restobar.papaya.com.pe/print/logo/sede-10.png');
  });

  it('devuelve cadena vacia cuando no hay nombre de archivo', () => {
    expect(urlImagen('https://restobar.papaya.com.pe/file/', '')).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', '   ')).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', null)).toBe('');
    expect(urlImagen('https://restobar.papaya.com.pe/file/', undefined)).toBe('');
  });

  it('no vuelve a prefijar una URL absoluta (segundo pase idempotente)', () => {
    const ya = urlImagen('https://restobar.papaya.com.pe/print/logo/', 'sede-10.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', ya)).toBe(ya);
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'http://otro.com/x.png'))
      .toBe('http://otro.com/x.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', '//cdn.com/x.png'))
      .toBe('//cdn.com/x.png');
    expect(urlImagen('https://restobar.papaya.com.pe/print/logo/', 'data:image/png;base64,AAA'))
      .toBe('data:image/png;base64,AAA');
  });

  it('sin base devuelve solo el nombre sin barra inicial', () => {
    expect(urlImagen('', 'sede-10.png')).toBe('sede-10.png');
    expect(urlImagen('', '/sede-10.png')).toBe('sede-10.png');
  });
});
