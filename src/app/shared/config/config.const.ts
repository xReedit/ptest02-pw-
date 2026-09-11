import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment';

export const IS_NATIVE = Capacitor.getPlatform() !== 'web';
export const IS_PLATAFORM_IOS = IS_NATIVE ? Capacitor.getPlatform() === 'ios' : false;

// Las URLs viven en environment.ts / environment.prod.ts; angular.json hace el reemplazo por configuración.
export const URL_SERVER = environment.apiUrl;
export const URL_SERVER_SOCKET = environment.socketUrl;
export const URL_SERVER_SOCKET_SPEECH = environment.speechSocketUrl;
export const URL_SERVER_FILE_AUDIO_SPEECH = environment.speechAudioUrl;
export const URL_IMG_CARTA = environment.imgCartaUrl; // imagenes de la carta
export const URL_IMG_PROMO = environment.imgPromoUrl; // imagenes de promociones
export const URL_IMG_COMERCIO = environment.imgComercioUrl;
export const URL_IMG_ICONS = environment.imgIconsUrl; // iconos

// sede a la que pertenece lo cacheado en sys::rules (las reglas no son globales)
export const KEY_RULES_SEDE = 'sys::rules-sede';

export const VIEW_APP_MOZO = false; // true = app solo mozo // solo para vista incial
export const URL_CONSULTA_RUC_DNI = 'https://apifac.papaya.com.pe/api/services/'; // consulta dni o ruc
// ponytail: TOKEN_CONSULTA sigue en el bundle. Va a un tercero (apifac.papaya.com.pe), no a
// nuestro backend, asi que sacarlo exige pasar la consulta por el backend: sprint aparte.
// TOKEN_SMS se borro en el sprint 5 junto con la ruta muerta delivery/send-sms-confirmation.
export const TOKEN_CONSULTA = 'tLKbDncvyKIPcgdVAGqt7rmy7W9mU9cnbawpZdc7JJv7l6h9cU'; // token de prueba
