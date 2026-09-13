import { DireccionEntregaService, KEY_DIRECCION_ENTREGA } from './direccion-entrega.service';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';

// Sin TestBed: el servicio solo depende de VerifyAuthClientService y de localStorage.
describe('DireccionEntregaService', () => {

  const dir = (direccion: string, ciudad = 'Tarapoto'): any => ({ direccion, ciudad });

  // doble del cliente: guarda la direccion como lo hace el de verdad (dentro del modelo)
  let clienteFalso: any;
  let verifyFalso: any;

  const crear = () => new DireccionEntregaService(verifyFalso);

  beforeEach(() => {
    localStorage.removeItem(KEY_DIRECCION_ENTREGA);
    clienteFalso = null;

    verifyFalso = {
      modelo: null as any,
      getClientSocket() { return this.modelo; },
      getDataClient() {
        if (!this.modelo) { this.modelo = clienteFalso || {}; }
        return this.modelo;
      },
      setDireccionDeliverySelected(val: DeliveryDireccionCliente) {
        if (!this.modelo) { throw new Error('sin modelo cargado'); }
        this.modelo.direccionEnvioSelected = val;
      }
    };
  });

  afterEach(() => localStorage.removeItem(KEY_DIRECCION_ENTREGA));

  describe('hidratacion al construir', () => {

    it('arranca vacio cuando no hay nada guardado', () => {
      const service = crear();

      expect(service.seleccionada).toBeNull();
      expect(service.hay()).toBe(false);
    });

    it('recupera la direccion del modelo del cliente', () => {
      clienteFalso = { direccionEnvioSelected: dir('Jiron Union 123') };

      const service = crear();

      expect(service.seleccionada.direccion).toBe('Jiron Union 123');
      expect(service.hay()).toBe(true);
    });

    it('recupera la direccion de sys::dir_se cuando el modelo no la tiene', () => {
      localStorage.setItem(KEY_DIRECCION_ENTREGA, JSON.stringify(dir('Av Peru 900')));

      const service = crear();

      expect(service.seleccionada.direccion).toBe('Av Peru 900');
    });

    it('manda el modelo del cliente cuando los dos almacenes discrepan', () => {
      clienteFalso = { direccionEnvioSelected: dir('La que vale') };
      localStorage.setItem(KEY_DIRECCION_ENTREGA, JSON.stringify(dir('La vieja')));

      const service = crear();

      expect(service.seleccionada.direccion).toBe('La que vale');
    });

    it('reconcilia: al hidratar los dos almacenes acaban iguales', () => {
      localStorage.setItem(KEY_DIRECCION_ENTREGA, JSON.stringify(dir('Av Peru 900')));

      crear();

      expect(verifyFalso.modelo.direccionEnvioSelected.direccion).toBe('Av Peru 900');
      expect(JSON.parse(localStorage.getItem(KEY_DIRECCION_ENTREGA)).direccion).toBe('Av Peru 900');
    });

    it('ignora lo guardado si esta corrupto o no tiene direccion', () => {
      spyOn(console, 'error');
      localStorage.setItem(KEY_DIRECCION_ENTREGA, '{no-es-json');

      expect(crear().seleccionada).toBeNull();

      localStorage.setItem(KEY_DIRECCION_ENTREGA, JSON.stringify({ ciudad: 'Tarapoto' }));

      expect(crear().seleccionada).toBeNull();
    });

  });

  describe('establecer', () => {

    it('avisa a los suscriptores en el momento', () => {
      const service = crear();
      const vistas: any[] = [];
      service.seleccionada$.subscribe(d => vistas.push(d));

      expect(vistas).toEqual([null]);

      service.establecer(dir('Jiron Union 123'));

      expect(vistas.length).toBe(2);
      expect(vistas[1].direccion).toBe('Jiron Union 123');
    });

    it('escribe los dos almacenes viejos', () => {
      const service = crear();

      expect(service.establecer(dir('Jiron Union 123'))).toBe(true);

      expect(JSON.parse(localStorage.getItem(KEY_DIRECCION_ENTREGA)).direccion).toBe('Jiron Union 123');
      expect(verifyFalso.modelo.direccionEnvioSelected.direccion).toBe('Jiron Union 123');
    });

    it('un suscriptor nuevo recibe la direccion vigente de entrada', () => {
      const service = crear();
      service.establecer(dir('Jiron Union 123'));

      let visto: any = 'nada';
      service.seleccionada$.subscribe(d => visto = d);

      expect(visto.direccion).toBe('Jiron Union 123');
    });

    it('no establece nada sin direccion', () => {
      const service = crear();

      expect(service.establecer(null)).toBe(false);
      expect(service.establecer({ ciudad: 'Tarapoto' } as any)).toBe(false);
      expect(service.seleccionada).toBeNull();
      expect(localStorage.getItem(KEY_DIRECCION_ENTREGA)).toBeNull();
    });

    it('no vuelve a avisar si es la misma direccion', () => {
      const service = crear();
      service.establecer(dir('Jiron Union 123'));

      let avisos = 0;
      service.seleccionada$.subscribe(() => avisos++);

      expect(service.establecer(dir('Jiron Union 123'))).toBe(true);
      expect(avisos).toBe(1); // solo el aviso inicial de la suscripcion
    });

    it('avisa cuando cambia a otra direccion', () => {
      const service = crear();
      service.establecer(dir('Jiron Union 123'));

      let avisos = 0;
      service.seleccionada$.subscribe(() => avisos++);

      service.establecer(dir('Av Peru 900'));

      expect(avisos).toBe(2);
      expect(service.seleccionada.direccion).toBe('Av Peru 900');
    });

    it('sigue en memoria aunque el storage rechace la escritura', () => {
      spyOn(console, 'error');
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceeded');

      const service = crear();

      expect(service.establecer(dir('Jiron Union 123'))).toBe(true);
      expect(service.seleccionada.direccion).toBe('Jiron Union 123');
    });

  });

  describe('limpiar', () => {

    it('borra los dos almacenes y avisa que ya no hay direccion', () => {
      clienteFalso = { direccionEnvioSelected: dir('Jiron Union 123') };
      const service = crear();

      let visto: any = 'nada';
      service.seleccionada$.subscribe(d => visto = d);

      service.limpiar();

      expect(service.seleccionada).toBeNull();
      expect(service.hay()).toBe(false);
      expect(visto).toBeNull();
      expect(localStorage.getItem(KEY_DIRECCION_ENTREGA)).toBeNull();
      expect(verifyFalso.modelo.direccionEnvioSelected).toBeNull();
    });

  });

});
