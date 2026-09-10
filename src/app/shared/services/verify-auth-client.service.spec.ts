import { VerifyAuthClientService } from './verify-auth-client.service';
import { b64EncodeUnicode } from '../utils/b64';

describe('VerifyAuthClientService.isLogin', () => {
  function make(auth0Ok: boolean): VerifyAuthClientService {
    const authNative = { isLoginSuccess: auth0Ok } as any;
    return new VerifyAuthClientService({} as any, {} as any, {} as any, {} as any, authNative);
  }
  beforeEach(() => localStorage.removeItem('sys::tpm'));

  it('true si Auth0 confirmó', () => { expect(make(true).isLogin()).toBeTrue(); });
  it('false sin sesión guardada', () => { expect(make(false).isLogin()).toBeFalse(); });
  it('true con sesión propia guardada (teléfono, DNI o social previo)', () => {
    localStorage.setItem('sys::tpm', b64EncodeUnicode(JSON.stringify({ isCliente: true, idcliente: 15, datalogin: { name: 'Ana' } })));
    expect(make(false).isLogin()).toBeTrue();
  });
  it('false para invitado', () => {
    localStorage.setItem('sys::tpm', b64EncodeUnicode(JSON.stringify({ isCliente: true, idcliente: 15, isLoginByInvitado: true })));
    expect(make(false).isLogin()).toBeFalse();
  });
});
