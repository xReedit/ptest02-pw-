// Genera android/app/src/main/res/drawable-*/ic_stat_notify.png:
// circulo blanco solido sobre fondo transparente. Android pinta el icono de la barra
// de estado como silueta: cualquier pixel con color se ve blanco y el alfa es la forma.
// Sin dependencias: PNG RGBA escrito a mano con zlib de Node.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
    tabla[n] = c;
  }
  return tabla;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) { c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([largo, cuerpo, crc]);
}

function circuloBlanco(lado) {
  const raw = Buffer.alloc(lado * (lado * 4 + 1));
  const centro = (lado - 1) / 2;
  const radio = lado / 2 - lado * 0.08; // margen de seguridad de la barra de estado
  let p = 0;
  for (let y = 0; y < lado; y++) {
    raw[p++] = 0; // filtro none
    for (let x = 0; x < lado; x++) {
      const dx = x - centro;
      const dy = y - centro;
      const dentro = Math.sqrt(dx * dx + dy * dy) <= radio;
      raw[p++] = 255;
      raw[p++] = 255;
      raw[p++] = 255;
      raw[p++] = dentro ? 255 : 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;  // bits por canal
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compresion
  ihdr[11] = 0; // filtro
  ihdr[12] = 0; // sin entrelazado
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    bloque('IHDR', ihdr),
    bloque('IDAT', zlib.deflateSync(raw)),
    bloque('IEND', Buffer.alloc(0))
  ]);
}

const DENSIDADES = [
  ['drawable-mdpi', 24],
  ['drawable-hdpi', 36],
  ['drawable-xhdpi', 48],
  ['drawable-xxhdpi', 72],
  ['drawable-xxxhdpi', 96]
];

const base = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
DENSIDADES.forEach(([carpeta, lado]) => {
  const destino = path.join(base, carpeta);
  fs.mkdirSync(destino, { recursive: true });
  fs.writeFileSync(path.join(destino, 'ic_stat_notify.png'), circuloBlanco(lado));
  process.stdout.write(`${carpeta}/ic_stat_notify.png ${lado}x${lado}\n`);
});
