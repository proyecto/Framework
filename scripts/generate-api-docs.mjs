#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = process.cwd();
const ts = require(path.join(rootDir, 'packages/core/node_modules/typescript'));

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const outFile = path.join(rootDir, 'docs/API_REFERENCE.md');

/** Limpia un bloque JSDoc a texto plano legible en una o varias líneas para Markdown. */
function getJsDocSummary(node) {
  const tagsAndDocs = ts.getJSDocCommentsAndTags(node);
  const parts = [];
  for (const entry of tagsAndDocs) {
    if (ts.isJSDoc(entry) && entry.comment) {
      const text =
        typeof entry.comment === 'string'
          ? entry.comment
          : ts.getTextOfJSDocComment(entry.comment);
      if (text) parts.push(text.trim());
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Construye una firma compacta en una línea sin el cuerpo de implementaciones. */
function formatSignature(node, sourceFile) {
  const printer = ts.createPrinter({ removeComments: true });
  if (ts.isInterfaceDeclaration(node)) {
    const typeParams = node.typeParameters?.length
      ? `<${node.typeParameters.map((tp) => tp.getText(sourceFile)).join(', ')}>`
      : '';
    const heritage = node.heritageClauses?.length
      ? ' ' + node.heritageClauses.map((h) => h.getText(sourceFile)).join(' ')
      : '';
    return `interface ${node.name.text}${typeParams}${heritage}`;
  }
  if (ts.isClassDeclaration(node)) {
    const abs = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AbstractKeyword)
      ? 'abstract '
      : '';
    const name = node.name?.text ?? 'AnonymousClass';
    const typeParams = node.typeParameters?.length
      ? `<${node.typeParameters.map((tp) => tp.getText(sourceFile)).join(', ')}>`
      : '';
    const heritage = node.heritageClauses?.length
      ? ' ' + node.heritageClauses.map((h) => h.getText(sourceFile)).join(' ')
      : '';
    return `${abs}class ${name}${typeParams}${heritage}`;
  }
  if (ts.isTypeAliasDeclaration(node)) {
    const typeParams = node.typeParameters?.length
      ? `<${node.typeParameters.map((tp) => tp.getText(sourceFile)).join(', ')}>`
      : '';
    const typeText = node.type.getText(sourceFile).replace(/\s+/g, ' ');
    return `type ${node.name.text}${typeParams} = ${typeText}`;
  }
  if (ts.isFunctionDeclaration(node)) {
    const asyncKw = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)
      ? 'async '
      : '';
    const name = node.name?.text ?? 'anonymous';
    const typeParams = node.typeParameters?.length
      ? `<${node.typeParameters.map((tp) => tp.getText(sourceFile)).join(', ')}>`
      : '';
    const params = node.parameters.map((p) => p.getText(sourceFile).replace(/\s+/g, ' ')).join(', ');
    const ret = node.type ? `: ${node.type.getText(sourceFile).replace(/\s+/g, ' ')}` : '';
    return `${asyncKw}function ${name}${typeParams}(${params})${ret}`;
  }
  if (ts.isVariableStatement(node)) {
    const decls = node.declarationList.declarations.map((d) => {
      const name = d.name.getText(sourceFile);
      const type = d.type ? `: ${d.type.getText(sourceFile).replace(/\s+/g, ' ')}` : '';
      return `${name}${type}`;
    });
    return `const ${decls.join(', ')}`;
  }
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile).split('\n')[0];
}

function getMemberSummary(member, sourceFile) {
  if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) {
    const isPrivate = member.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword
    );
    if (isPrivate) return null;
    const opt = member.questionToken ? '?' : '';
    const typeText = member.type ? member.type.getText(sourceFile).replace(/\s+/g, ' ') : 'unknown';
    return `${member.name.getText(sourceFile)}${opt}: ${typeText}`;
  }
  if (ts.isMethodSignature(member) || ts.isMethodDeclaration(member)) {
    const isPrivate = member.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword
    );
    if (isPrivate) return null;
    const params = member.parameters
      .map((p) => p.getText(sourceFile).replace(/\s+/g, ' '))
      .join(', ');
    const ret = member.type ? member.type.getText(sourceFile).replace(/\s+/g, ' ') : 'void';
    const opt = member.questionToken ? '?' : '';
    return `${member.name.getText(sourceFile)}${opt}(${params}): ${ret}`;
  }
  if (ts.isConstructorDeclaration(member)) {
    const params = member.parameters
      .map((p) => p.getText(sourceFile).replace(/\s+/g, ' '))
      .join(', ');
    return `constructor(${params})`;
  }
  return null;
}

/** Recoge módulos re-exportados desde `packages/<pkg>/src/index.ts`. */
function resolvePackageSourceFiles(pkgDir) {
  const indexTsx = path.join(pkgDir, 'src/index.tsx');
  const indexTs = path.join(pkgDir, 'src/index.ts');
  const entry = fs.existsSync(indexTs) ? indexTs : fs.existsSync(indexTsx) ? indexTsx : null;
  if (!entry) return [];

  const visited = new Set();
  const ordered = [];

  function walk(filePath) {
    const normalized = path.resolve(filePath);
    if (visited.has(normalized) || !fs.existsSync(normalized)) return;
    visited.add(normalized);

    const text = fs.readFileSync(normalized, 'utf8');
    const scriptKind = normalized.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(normalized, text, ts.ScriptTarget.ES2022, true, scriptKind);

    for (const stmt of sourceFile.statements) {
      if (
        ts.isExportDeclaration(stmt) &&
        stmt.moduleSpecifier &&
        ts.isStringLiteral(stmt.moduleSpecifier)
      ) {
        const spec = stmt.moduleSpecifier.text;
        if (spec.startsWith('./') || spec.startsWith('../')) {
          const base = spec.replace(/\.js$/, '');
          const candidateTs = path.resolve(path.dirname(normalized), `${base}.ts`);
          const candidateTsx = path.resolve(path.dirname(normalized), `${base}.tsx`);
          if (fs.existsSync(candidateTs)) walk(candidateTs);
          else if (fs.existsSync(candidateTsx)) walk(candidateTsx);
        }
      }
    }

    ordered.push({ filePath: normalized, sourceFile });
  }

  walk(entry);
  return ordered;
}

function generateApiDocsMarkdown() {
  const packagesDir = path.join(rootDir, 'packages');
  const pkgFolders = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const lines = [
    '<!-- ARCHIVO GENERADO AUTOMÁTICAMENTE POR scripts/generate-api-docs.mjs -->',
    '<!-- NO EDITAR A MANO: ejecuta `corepack pnpm docs:generate` tras cambiar la API pública -->',
    '',
    '# Referencia de API Pública del Framework',
    '',
    'Este documento se genera directamente desde el AST de TypeScript y los comentarios JSDoc de todos los paquetes en `packages/*`, garantizando que la documentación nunca quede desincronizada respecto al código fuente.',
    '',
    '## Índice de paquetes',
    ''
  ];

  const packageDocs = [];

  for (const folder of pkgFolders) {
    const pkgDir = path.join(packagesDir, folder);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const pkgName = pkgJson.name ?? `@framework/${folder}`;
    const files = resolvePackageSourceFiles(pkgDir);

    const symbols = [];
    for (const { filePath, sourceFile } of files) {
      const relFile = path.relative(rootDir, filePath).replace(/\\/g, '/');
      for (const stmt of sourceFile.statements) {
        const isExported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (!isExported) continue;

        if (
          ts.isInterfaceDeclaration(stmt) ||
          ts.isClassDeclaration(stmt) ||
          ts.isTypeAliasDeclaration(stmt) ||
          ts.isFunctionDeclaration(stmt) ||
          ts.isVariableStatement(stmt)
        ) {
          let name = '';
          if (ts.isVariableStatement(stmt)) {
            name = stmt.declarationList.declarations
              .map((d) => d.name.getText(sourceFile))
              .join(', ');
          } else {
            name = stmt.name?.text ?? '(anonymous)';
          }

          const members = [];
          if (ts.isInterfaceDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
            for (const member of stmt.members) {
              const summary = getMemberSummary(member, sourceFile);
              if (summary) members.push(summary);
            }
          }

          symbols.push({
            name,
            relFile,
            signature: formatSignature(stmt, sourceFile),
            doc: getJsDocSummary(stmt),
            members
          });
        }
      }
    }

    const anchor = pkgName.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    lines.push(`- [\`${pkgName}\`](#${anchor}) (${symbols.length} símbolos exportados)`);
    packageDocs.push({ pkgName, folder, description: pkgJson.description ?? '', symbols });
  }

  lines.push('');

  for (const pkg of packageDocs) {
    lines.push(`## \`${pkg.pkgName}\``);
    lines.push('');
    if (pkg.description) {
      lines.push(pkg.description);
      lines.push('');
    }

    if (pkg.symbols.length === 0) {
      lines.push('_Sin símbolos públicos exportados directamente._');
      lines.push('');
      continue;
    }

    for (const sym of pkg.symbols) {
      lines.push(`### \`${sym.name}\``);
      lines.push('');
      lines.push(`- Origen: \`${sym.relFile}\``);
      if (sym.doc) {
        lines.push(`- Descripción: ${sym.doc}`);
      }
      lines.push('');
      lines.push('```ts');
      lines.push(sym.signature);
      lines.push('```');
      if (sym.members.length > 0) {
        lines.push('');
        lines.push('Miembros públicos:');
        for (const member of sym.members) {
          lines.push(`- \`${member}\``);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

const generated = generateApiDocsMarkdown();

if (checkOnly) {
  const existing = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
  if (existing !== generated) {
    console.error(
      `❌ ${path.relative(rootDir, outFile)} está desactualizado respecto al código fuente.\n` +
        '   Ejecuta "corepack pnpm docs:generate" para regenerarlo.'
    );
    process.exit(1);
  }
  console.log(`✅ ${path.relative(rootDir, outFile)} está sincronizado con los exports TypeScript.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, generated, 'utf8');
console.log(`✅ Documentación generada en ${path.relative(rootDir, outFile)}.`);

