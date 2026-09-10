import { SocketService } from './socket.service';

class FakeSocket {
  connected = true;
  id = 'abc';
  handlers: { [k: string]: Function[] } = {};
  emitted: any[] = [];
  on(evt: string, fn: Function) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); }
  off(evt: string, fn?: Function) {
    if (!fn) { delete this.handlers[evt]; return; }
    this.handlers[evt] = (this.handlers[evt] || []).filter(h => h !== fn);
  }
  emit(evt: string, data: any, ack?: Function) { this.emitted.push({ evt, data, ack }); }
  fire(evt: string, payload: any) { (this.handlers[evt] || []).forEach(h => h(payload)); }
  disconnect() { this.connected = false; }
}

function makeService(): { svc: SocketService, sock: FakeSocket } {
  const listen = { setIisMsjConexionLentaSendPedidoSourse: () => {} } as any;
  const svc = new SocketService({} as any, {} as any, listen);
  const sock = new FakeSocket();
  (svc as any).socket = sock;
  return { svc, sock };
}

describe('SocketService.asyncEmitPedido', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('resuelve con el ack del servidor', async () => {
    const { svc, sock } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}');
    sock.emitted[0].ack([{ idpedido: 7 }]);
    expect(await p).toEqual([{ idpedido: 7 }]);
  });

  it('resuelve con el evento de respuesta y limpia el listener', async () => {
    const { svc, sock } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}');
    sock.fire('nuevoPedidoRes', [{ idpedido: 8 }]);
    expect(await p).toEqual([{ idpedido: 8 }]);
    expect((sock.handlers['nuevoPedidoRes'] || []).length).toBe(0);
  });

  it('rechaza por timeout', async () => {
    const { svc } = makeService();
    const p = svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}', 1000);
    jasmine.clock().tick(1001);
    await expectAsync(p).toBeRejectedWithError('timeout');
  });

  it('rechaza si el socket no está conectado', async () => {
    const { svc, sock } = makeService();
    sock.connected = false;
    await expectAsync(svc.asyncEmitPedido('nuevoPedido', 'nuevoPedidoRes', '{}')).toBeRejectedWithError('socket-desconectado');
  });
});

describe('SocketService.fromEvent', () => {
  it('sigue entregando eventos después de reemplazar la instancia de socket', () => {
    const { svc, sock } = makeService();
    const recibidos: any[] = [];
    svc.onReglasCarta().subscribe(v => recibidos.push(v));
    sock.fire('getReglasCarta', 1);
    const sock2 = new FakeSocket();
    (svc as any).socket = sock2;
    (svc as any).rebindEvents();
    sock2.fire('getReglasCarta', 2);
    expect(recibidos).toEqual([1, 2]);
  });
});
