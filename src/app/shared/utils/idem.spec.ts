import { claveIdem } from './idem';

describe('claveIdem', () => {
  const carrito = (cantidad: number) => ({ tipoconsumo: [{ items: [{ iditem: 7, cantidad }] }] });

  it('el mismo carrito da la misma clave', () => {
    expect(claveIdem(10, 3, carrito(2))).toBe(claveIdem(10, 3, carrito(2)));
  });

  it('otra cantidad da otra clave', () => {
    expect(claveIdem(10, 3, carrito(2))).not.toBe(claveIdem(10, 3, carrito(3)));
  });

  it('otro cliente da otra clave', () => {
    expect(claveIdem(10, 3, carrito(2))).not.toBe(claveIdem(11, 3, carrito(2)));
  });

  it('usa 0 cuando no hay cliente ni sede', () => {
    expect(claveIdem(null, undefined, carrito(1)).startsWith('0-0-')).toBe(true);
  });
});
