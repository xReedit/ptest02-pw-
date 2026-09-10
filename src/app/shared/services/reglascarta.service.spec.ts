import { Subject } from 'rxjs';
import { ReglascartaService } from './reglascarta.service';

describe('ReglascartaService.loadReglasCarta', () => {
  let store: { [k: string]: string };
  let storage: any;
  let socketEvt: Subject<any>;
  let svc: ReglascartaService;

  beforeEach(() => {
    store = {};
    storage = {
      get: (k: string) => store[k],
      set: (k: string, v: string) => { store[k] = v; },
      isExistKey: (k: string) => k in store
    };
    socketEvt = new Subject<any>();
    const socket = { onReglasCarta: () => socketEvt.asObservable() } as any;
    svc = new ReglascartaService(storage, socket);
  });

  it('emite primero lo cacheado y luego lo del socket', () => {
    store['sys::rules'] = btoa(JSON.stringify({ reglas: ['cache'], subtotales: [] }));
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    socketEvt.next([{ reglas: ['socket'], subtotales: [1] }]);
    expect(emitidos.map(e => e.reglas[0])).toEqual(['cache', 'socket']);
    expect(JSON.parse(atob(store['sys::rules'])).reglas[0]).toBe('socket');
  });

  it('sin caché solo emite lo del socket y tolera respuesta como objeto', () => {
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    socketEvt.next({ reglas: ['obj'], subtotales: [] });
    expect(emitidos.length).toBe(1);
    expect(emitidos[0].reglas[0]).toBe('obj');
  });

  it('ignora caché corrupta', () => {
    store['sys::rules'] = '%%%';
    const emitidos: any[] = [];
    svc.loadReglasCarta().subscribe(v => emitidos.push(v));
    expect(emitidos.length).toBe(0);
  });
});
