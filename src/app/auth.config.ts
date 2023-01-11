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
console.log('IS_NATIVE', IS_NATIVE);
export const callbackUri = IS_NATIVE
    ? `${appId}://${auth0Domain}/capacitor/${appId}/callback-auth`
    : 'http://localhost:1800/callback-auth';
