import { extraerUrlDeMatriz } from './navigator-link.service';

describe('extraerUrlDeMatriz', () => {
  it('devuelve la url tal cual cuando no hay parámetro de matriz', () => {
    expect(extraerUrlDeMatriz('/pedido')).toBe('/pedido');
  });
  it('extrae el valor del parámetro state', () => {
    expect(extraerUrlDeMatriz('/pedido;state=mipedido')).toBe('mipedido');
  });
});
