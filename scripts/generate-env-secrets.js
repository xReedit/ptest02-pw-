const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`No se encontró ${filePath}. Copia .env.example a .env y define GOOGLE_MAPS_API_KEY.`);
    process.exit(1);
  }

  const vars = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function upsertProperty(filePath, key, value) {
  let content = '';

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
    const propertyRegex = new RegExp(`^${key}=.*$`, 'm');
    if (propertyRegex.test(content)) {
      content = content.replace(propertyRegex, `${key}=${value}`);
      fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`);
      return;
    }
  }

  const prefix = content.trim().length > 0 ? `${content.trim()}\n` : '';
  fs.writeFileSync(filePath, `${prefix}${key}=${value}\n`);
}

const envVars = loadEnvFile(envPath);
const googleMapsApiKey = envVars.GOOGLE_MAPS_API_KEY;

if (!googleMapsApiKey) {
  console.error('GOOGLE_MAPS_API_KEY no está definida en .env');
  process.exit(1);
}

const secretsFilePath = path.join(rootDir, 'src/environments/env.secrets.ts');
const secretsContent = `// Archivo generado desde .env. No editar manualmente.
export const envSecrets = {
  googleMapsApiKey: '${googleMapsApiKey.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'
};
`;

fs.writeFileSync(secretsFilePath, secretsContent);

const localPropertiesPath = path.join(rootDir, 'android/local.properties');
upsertProperty(localPropertiesPath, 'GOOGLE_MAPS_API_KEY', googleMapsApiKey);

console.log('Variables de entorno generadas correctamente.');
