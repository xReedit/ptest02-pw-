import { Capacitor } from '@capacitor/core';
export const IS_NATIVE = Capacitor.isNativePlatform();

// pruebas
// export const URL_SERVER = 'http://192.168.1.39:5819/v3/'; // desarrollo
// export const URL_SERVER_SOCKET = 'http://192.168.1.39:5819'; // desarrollo
// export const URL_SERVER_SOCKET_SPEECH = 'http://192.168.1.39:1337'; //
// export const URL_SERVER_FILE_AUDIO_SPEECH = 'http://192.168.1.39:1337/resources/'; //
// export const URL_IMG_CARTA = 'http://192.168.1.65/restobar/file/'; // imagenes de la carta
// export const URL_IMG_PROMO = 'http://192.168.1.65/restobar/repositorio/img_promo'; // imagenes de promociones
// export const URL_IMG_COMERCIO = 'http://192.168.1.65/restobar/print/logo/';
// export const VAPID_PUBLIC = 'BC7ietauZE99Hx9HkPyuGVr8jaYETyEJgH-gLaYIsbORYobppt9dX49_K_wubDqphu1afi7XrM6x1zAp4kJh_wU';

// export const VAPID_PUBLIC = 'BOiwO8PftVFo8MrQfp3oAv4KbVtFdZAQojGKgzyxMCPgiNhg8PySbOSlkxDqd3iKA4J1GhzwFiCIGKmXRiKZM_0';
// export const URL_CONSULTA_RUC_DNI = 'http://apifacturalo_a.test:8080/api/services/'; // consulta dni o ruc


// produccion
export const URL_SERVER = 'https://app.restobar.papaya.com.pe/api.pwa/v3'; // produccion
export const URL_SERVER_SOCKET = 'https://app.restobar.papaya.com.pe/'; // produccion
export const URL_SERVER_SOCKET_SPEECH = 'https://app.restobar.papaya.com.pe/';
export const URL_SERVER_FILE_AUDIO_SPEECH = 'https://app.restobar.papaya.com.pe/speech/resources/'; //
export const URL_IMG_CARTA = IS_NATIVE ? 'https://restobar.papaya.com.pe/file/' : '//restobar.papaya.com.pe/file/'; // web
export const URL_IMG_PROMO = IS_NATIVE ? 'https://restobar.papaya.com.pe/repositorio/img_promo/' : '//restobar.papaya.com.pe/repositorio/img_promo'; // imagenes de promosiones
// export const URL_IMG_CARTA = 'https://restobar.papaya.com.pe/file/'; // capacitor
export const URL_IMG_COMERCIO = IS_NATIVE ? 'https://restobar.papaya.com.pe/print/logo' : '//restobar.papaya.com.pe/print/logo';
export const VAPID_PUBLIC = 'BOiwO8PftVFo8MrQfp3oAv4KbVtFdZAQojGKgzyxMCPgiNhg8PySbOSlkxDqd3iKA4J1GhzwFiCIGKmXRiKZM_0';

export const VIEW_APP_MOZO = false; // true = app solo mozo // solo para vista incial
export const URL_CONSULTA_RUC_DNI = 'https://apifac.papaya.com.pe/api/services/'; // consulta dni o ruc
export const TOKEN_CONSULTA = 'tLKbDncvyKIPcgdVAGqt7rmy7W9mU9cnbawpZdc7JJv7l6h9cU'; // token de prueba
export const TOKEN_SMS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicGFwYXlhLXNtcyIsImlhdCI6MTAwMDIwMDAzMDAwfQ.bKnTHEEGW_SustFir-40ZAYcHtfIo7Gyjq7c2onsAj0'; // token de prueba



// export const URL_SERVER_SOCKET = '/'; // produccion

