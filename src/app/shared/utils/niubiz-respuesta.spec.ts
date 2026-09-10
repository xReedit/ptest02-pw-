import { autorizacionExitosa } from './niubiz-respuesta';

describe('autorizacionExitosa', () => {
  it('acepta success true sin errorCode', () => {
    const rpta = { success: true, data: { dataMap: { ACTION_CODE: '000' } } };
    expect(autorizacionExitosa(rpta)).toBe(true);
  });

  it('rechaza una tarjeta declinada (success false, ACTION_CODE 116)', () => {
    const rpta = { success: false, data: { dataMap: { ACTION_CODE: '116' } } };
    expect(autorizacionExitosa(rpta)).toBe(false);
  });

  it('rechaza success true con errorCode', () => {
    const rpta = { success: true, data: { errorCode: 400 } };
    expect(autorizacionExitosa(rpta)).toBe(false);
  });

  it('rechaza respuesta nula', () => {
    expect(autorizacionExitosa(null)).toBe(false);
  });
});
