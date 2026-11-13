#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appsDir = path.join(rootDir, 'apps');

/**
 * Calcula la siguiente versión CalVer (YYYY.MM.BUILD) y versionCode Android (YYMMDDXX).
 *
 * - `version`: Formato "YYYY.MM.RELEASE" (ej: "2026.11.1", "2026.11.2").
 *   Si cambia de mes, reinicia a "YYYY.MM.1".
 * - `versionCode` (Android): Entero monotónico estrictamente creciente "YYMMDDXX"
 *   (ej: 26111301). Si ya se hizo una release hoy, incrementa a 26111302.
 *   Si el código existente por cualquier motivo fuera mayor, hace `existente + 1`.
 */
export function calculateNextCalVer(currentVersion = '0.0.0', currentVersionCode = 0, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const year2 = String(year).slice(-2);

  const calverPrefix = `${year}.${month}`;
  let nextBuild = 1;

  if (typeof currentVersion === 'string' && currentVersion.startsWith(`${calverPrefix}.`)) {
    const parts = currentVersion.split('.');
    const lastNum = parseInt(parts[2] ?? '0', 10);
    if (!Number.isNaN(lastNum)) {
      nextBuild = lastNum + 1;
    }
  }

  const nextVersion = `${calverPrefix}.${nextBuild}`;

  // Android versionCode: YYMMDD01 base
  const dayBaseCode = parseInt(`${year2}${month}${day}01`, 10);
  let nextVersionCode = dayBaseCode;

  if (currentVersionCode >= dayBaseCode) {
    nextVersionCode = currentVersionCode + 1;
  }

  return {
    version: nextVersion,
    versionCode: nextVersionCode,
    releaseDate: now.toISOString()
  };
}

/** Detecta qué aplicaciones en `apps/` tienen cambios en git (staged, unstaged o untracked). */
export function getChangedApps() {
  let gitOutput = '';
  try {
    gitOutput = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
  } catch {
    return [];
  }

  const changedAppNames = new Set();
  const lines = gitOutput.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    // Formato git status --porcelain: " M apps/base-expo/src/..." o "?? apps/base-web/..."
    const rawPath = line.slice(3).trim().replace(/^"|"$/g, '');
    const match = rawPath.match(/^apps\/([^/]+)\/(.+)$/);
    if (!match) continue;

    const [, appName, subPath] = match;

    // Ignora los propios archivos generados por este script para evitar bucles
    if (
      subPath === 'src/version.ts' ||
      subPath === 'package.json' ||
      subPath === 'app.json'
    ) {
      continue;
    }

    changedAppNames.add(appName);
  }

  return Array.from(changedAppNames).sort();
}

/** Aplica la actualización de versión a una aplicación concreta. */
export function bumpAppVersion(appName, options = {}) {
  const appPath = path.join(appsDir, appName);
  if (!fs.existsSync(appPath) || !fs.statSync(appPath).isDirectory()) {
    throw new Error(`La aplicación "${appName}" no existe en ${appsDir}.`);
  }

  const pkgJsonPath = path.join(appPath, 'package.json');
  const appJsonPath = path.join(appPath, 'app.json');
  const versionTsPath = path.join(appPath, 'src/version.ts');

  let currentVersion = '0.0.0';
  let currentVersionCode = 0;
  let pkgData = null;
  let appData = null;

  if (fs.existsSync(pkgJsonPath)) {
    pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    currentVersion = pkgData.version ?? '0.0.0';
  }

  if (fs.existsSync(appJsonPath)) {
    appData = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    currentVersionCode = appData.expo?.android?.versionCode ?? 0;
    if (appData.expo?.version) {
      currentVersion = appData.expo.version;
    }
  }

  const next = calculateNextCalVer(currentVersion, currentVersionCode);

  if (options.dryRun) {
    console.log(
      `[dry-run] ${appName}: ${currentVersion} (code: ${currentVersionCode}) -> ${next.version} (code: ${next.versionCode})`
    );
    return next;
  }

  // 1. Actualiza package.json si existe
  if (pkgData) {
    pkgData.version = next.version;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgData, null, 2) + '\n', 'utf8');
  }

  // 2. Actualiza app.json si es app Expo
  if (appData && appData.expo) {
    appData.expo.version = next.version;
    if (!appData.expo.android) {
      appData.expo.android = {};
    }
    appData.expo.android.versionCode = next.versionCode;
    fs.writeFileSync(appJsonPath, JSON.stringify(appData, null, 2) + '\n', 'utf8');
  }

  // Obtiene la versión de la plantilla canónica base-expo
  let baseVersion = next.version;
  const basePkgPath = path.join(appsDir, 'base-expo', 'package.json');
  if (appName !== 'base-expo' && fs.existsSync(basePkgPath)) {
    try {
      const basePkg = JSON.parse(fs.readFileSync(basePkgPath, 'utf8'));
      if (basePkg.version) {
        baseVersion = basePkg.version;
      }
    } catch {
      // Ignora errores de lectura y usa fallback
    }
  }

  // 3. Genera src/version.ts exportando las constantes tipadas
  const versionFileContent = `/**
 * Archivo generado automáticamente por scripts/bump-version.mjs.
 * NO EDITAR MANUALMENTE.
 */
export const APP_VERSION = '${next.version}';
export const APP_BUILD = ${next.versionCode};
export const APP_RELEASE_DATE = '${next.releaseDate}';
export const BASE_VERSION = '${baseVersion}';
`;
  fs.mkdirSync(path.dirname(versionTsPath), { recursive: true });
  fs.writeFileSync(versionTsPath, versionFileContent, 'utf8');

  console.log(
    `✅ [${appName}] Versión actualizada: ${next.version} (build/code: ${next.versionCode})`
  );

  return next;
}

// Ejecución CLI directa
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isAuto = args.includes('--auto') || args.includes('--all-changed');
  const isAll = args.includes('--all');
  const targetApp = args.find((a) => !a.startsWith('--'));

  if (isAuto) {
    const changed = getChangedApps();
    if (changed.length === 0) {
      console.log('ℹ️ No se detectaron cambios pendientes en ninguna aplicación de apps/.');
      process.exit(0);
    }
    console.log(`Detectadas ${changed.length} app(s) con cambios: ${changed.join(', ')}`);
    for (const appName of changed) {
      bumpAppVersion(appName, { dryRun });
    }
  } else if (isAll) {
    const apps = fs
      .readdirSync(appsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const appName of apps) {
      bumpAppVersion(appName, { dryRun });
    }
  } else if (targetApp) {
    bumpAppVersion(targetApp, { dryRun });
  } else {
    console.log(`Uso:
  node scripts/bump-version.mjs <app-name>        # Actualiza una app concreta (ej: base-expo)
  node scripts/bump-version.mjs --auto           # Detecta automáticamente apps con cambios en git
  node scripts/bump-version.mjs --all            # Actualiza todas las apps de apps/
  Opciones:
    --dry-run   Muestra el cálculo sin escribir en disco
`);
  }
}
