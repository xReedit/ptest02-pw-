import { b64DecodeUnicode, b64EncodeUnicode } from './b64';

describe('b64 unicode', () => {
  it('codifica y decodifica emoji y acentos', () => {
    const s = JSON.stringify({ name: 'José Ñandú 🍊', sub: 'google|1' });
    expect(b64DecodeUnicode(b64EncodeUnicode(s))).toBe(s);
  });
  it('decodifica lo que se guardó antes con btoa plano', () => {
    const s = JSON.stringify({ name: 'MARIA' });
    expect(b64DecodeUnicode(btoa(s))).toBe(s);
  });
  it('lanza con entrada inválida', () => {
    expect(() => b64DecodeUnicode('%%%')).toThrow();
  });
});
