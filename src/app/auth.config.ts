import config from '../../capacitor.config';
import { IS_NATIVE } from './shared/config/config.const';
// import { IS_NATIVE } from '../config/config.const';

export const domain = 'dev-m48s1pe2.auth0.com';
export const clientId = 'kSs64dcx34Fo7HpDLYkE3gQH0v2MtcdR';
const { appId } = config;

const auth0Domain = domain;
// const iosOrAndroid = IS_NATIVE;

// solo nativo
// export const callbackUri = `${appId}://${auth0Domain}/capacitor/${appId}/callback`    
// console.log('IS_NATIVE', IS_NATIVE);
// En nativo el callback es el deep link del app. En web se arma con el origen
// real de la pagina (localhost:4200, el host de ngrok, o produccion) para no
// depender de un puerto fijo. Cada origen web debe estar en "Allowed Callback
// URLs" de Auth0 como <origen>/callback-auth.
export const callbackUri = IS_NATIVE
    ? `${appId}://${auth0Domain}/capacitor/${appId}/callback-auth`
    : `${window.location.origin}/callback-auth`;
