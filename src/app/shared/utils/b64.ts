// base64 seguro para cualquier texto (btoa solo acepta Latin-1)
export function b64EncodeUnicode(s: string): string {
  return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

export function b64DecodeUnicode(s: string): string {
  const bin = atob(s);
  try {
    return decodeURIComponent(bin.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (error) {
    return bin; // guardado antes con btoa plano
  }
}
