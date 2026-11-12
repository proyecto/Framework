#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = process.cwd();
const ts = require(path.join(rootDir, 'packages/core/node_modules/typescript'));

const errors = [];
const checks = [];

function recordError(rule, file, detail) {
  errors.push(`[${rule}] ${path.relative(rootDir, file)}: ${detail}`);
}

function listFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(full, predicate));
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

/** Extrae todos los specifiers de `import ... from '...'`, `export ... from '...'` y `require('...')` usando el AST de TypeScript. */
function extractModuleSpecifiers(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.ES2022, true, scriptKind);
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { specifiers, sourceFile };
}

function parseWorkspaceCatalog(yamlPath) {
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const catalogKeys = new Set();
  let inCatalog = false;
  for (const line of lines) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (inCatalog) {
      if (/^\S/.test(line) && line.trim() !== '') {
        inCatalog = false;
        continue;
      }
      const match = line.match(/^\s{2}(["']?[^"':]+["']?)\s*:/);
      if (match) {
        catalogKeys.add(match[1].replace(/^["']|["']$/g, ''));
      }
    }
  }
  return catalogKeys;
}

const isTsSource = (file) =>
  (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts');
const isNonTestTsSource = (file) => isTsSource(file) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx');

// 1. @framework/core: cero imports externos (solo relativos ./ o ../)
const coreFiles = listFiles(path.join(rootDir, 'packages/core/src'), isNonTestTsSource);
for (const file of coreFiles) {
  const { specifiers } = extractModuleSpecifiers(file);
  for (const spec of specifiers) {
    if (!spec.startsWith('./') && !spec.startsWith('../')) {
      recordError('DIP-CORE-PURE', file, `El núcleo @framework/core no puede importar "${spec}".`);
    }
  }
}
checks.push(`DIP-CORE-PURE (${coreFiles.length} archivos revisados)`);

// 2. Dominios (*-domain): solo pueden importar @framework/core, @framework/data o rutas relativas
const domainPackages = fs
  .readdirSync(path.join(rootDir, 'packages'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith('-domain'))
  .map((d) => d.name);

let domainFileCount = 0;
for (const pkgName of domainPackages) {
  const domainFiles = listFiles(path.join(rootDir, 'packages', pkgName, 'src'), isNonTestTsSource);
  domainFileCount += domainFiles.length;
  for (const file of domainFiles) {
    const { specifiers } = extractModuleSpecifiers(file);
    for (const spec of specifiers) {
      const allowed =
        spec.startsWith('./') ||
        spec.startsWith('../') ||
        spec === '@framework/core' ||
        spec === '@framework/data';
      if (!allowed) {
        recordError(
          'MVC-DOMAIN-ISOLATION',
          file,
          `El dominio "${pkgName}" debe ser agnóstico de plataforma/UI/BD, pero importa "${spec}".`
        );
      }
    }
  }
}
checks.push(`MVC-DOMAIN-ISOLATION (${domainFileCount} archivos en ${domainPackages.length} dominio(s))`);

// 3 & 4. Adapters exclusivos: expo-sqlite solo en expo-adapter (en packages/), @libsql/client solo en data-libsql
const allPackageFiles = listFiles(path.join(rootDir, 'packages'), isNonTestTsSource);
const allWorkspaceSourceFiles = [
  ...allPackageFiles,
  ...listFiles(path.join(rootDir, 'apps'), isNonTestTsSource)
];

for (const file of allPackageFiles) {
  const { specifiers } = extractModuleSpecifiers(file);
  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  for (const spec of specifiers) {
    if (spec === 'expo-sqlite' && !rel.startsWith('packages/expo-adapter/')) {
      recordError(
        'ADAPTER-BOUNDARY-EXPO',
        file,
        'expo-sqlite solo puede importarse dentro de packages/expo-adapter.'
      );
    }
  }
}
for (const file of allWorkspaceSourceFiles) {
  const { specifiers } = extractModuleSpecifiers(file);
  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  for (const spec of specifiers) {
    if (spec === '@libsql/client' && !rel.startsWith('packages/data-libsql/')) {
      recordError(
        'ADAPTER-BOUNDARY-LIBSQL',
        file,
        '@libsql/client solo puede importarse dentro de packages/data-libsql.'
      );
    }
  }
}
checks.push(`ADAPTER-BOUNDARIES (${allWorkspaceSourceFiles.length} archivos revisados)`);

// 5. Dirección de dependencias entre paquetes base (@framework/data y @framework/server)
const forbiddenByPackage = {
  data: ['@framework/data-libsql', '@framework/expo-adapter', '@framework/server', '@framework/react', '@framework/ui'],
  server: ['@framework/expo-adapter', '@framework/react', '@framework/ui']
};

let directionCount = 0;
for (const [pkg, forbiddenList] of Object.entries(forbiddenByPackage)) {
  const files = listFiles(path.join(rootDir, 'packages', pkg, 'src'), isNonTestTsSource);
  directionCount += files.length;
  for (const file of files) {
    const { specifiers } = extractModuleSpecifiers(file);
    for (const spec of specifiers) {
      if (forbiddenList.includes(spec)) {
        recordError(
          'LAYER-DIRECTION',
          file,
          `El paquete "@framework/${pkg}" viola la dirección de dependencias al importar "${spec}".`
        );
      }
    }
  }
}
checks.push(`LAYER-DIRECTION (${directionCount} archivos revisados)`);

// 6. Catálogo centralizado de versiones (pnpm-workspace.yaml)
const catalogKeys = parseWorkspaceCatalog(path.join(rootDir, 'pnpm-workspace.yaml'));
let pkgJsonCount = 0;
for (const base of ['packages', 'apps']) {
  const baseDir = path.join(rootDir, base);
  if (!fs.existsSync(baseDir)) continue;
  for (const dir of fs.readdirSync(baseDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const pkgPath = path.join(baseDir, dir.name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    pkgJsonCount += 1;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    for (const section of ['dependencies', 'devDependencies']) {
      const deps = pkg[section] ?? {};
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (depName.startsWith('@framework/')) {
          if (!String(depVersion).startsWith('workspace:')) {
            recordError(
              'WORKSPACE-PROTOCOL',
              pkgPath,
              `"${depName}" debe usar "workspace:*" en lugar de "${depVersion}".`
            );
          }
        } else if (catalogKeys.has(depName) && depVersion !== 'catalog:') {
          recordError(
            'CATALOG-VERSION',
            pkgPath,
            `"${depName}" está en pnpm-workspace.yaml catalog: y debe declararse como "catalog:" (actual: "${depVersion}").`
          );
        }
      }
    }
  }
}
checks.push(`CATALOG-VERSION & WORKSPACE-PROTOCOL (${pkgJsonCount} package.json revisados)`);

// 7. Cobertura mínima de JSDoc en símbolos públicos exportados de @framework/core
let documentedCoreExports = 0;
for (const file of coreFiles) {
  if (file.endsWith('/index.ts')) continue;
  const { sourceFile } = extractModuleSpecifiers(file);
  for (const stmt of sourceFile.statements) {
    const isExported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    if (
      ts.isInterfaceDeclaration(stmt) ||
      ts.isClassDeclaration(stmt) ||
      ts.isFunctionDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt)
    ) {
      const jsDocs = ts.getJSDocCommentsAndTags(stmt);
      const name = stmt.name?.text ?? '(anonymous)';
      if (!jsDocs || jsDocs.length === 0) {
        recordError(
          'CORE-JSDOC',
          file,
          `La declaración exportada "${name}" en @framework/core debe incluir un comentario JSDoc /** ... */.`
        );
      } else {
        documentedCoreExports += 1;
      }
    }
  }
}
checks.push(`CORE-JSDOC (${documentedCoreExports} símbolos públicos documentados)`);

if (errors.length > 0) {
  console.error('❌ Verificación arquitectónica fallida:\n');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('✅ Verificación arquitectónica SOLID / MVC / Catalog superada:');
for (const check of checks) {
  console.log(`  ✓ ${check}`);
}

