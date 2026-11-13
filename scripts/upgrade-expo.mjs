#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const workspaceFile = path.resolve(process.cwd(), 'pnpm-workspace.yaml');
const content = fs.readFileSync(workspaceFile, 'utf8');

const args = process.argv.slice(2);
const sdkArg = args.find((a) => a.startsWith('--expo='));

console.log('=== Framework Expo Centralized Catalog ===');
const trackedKeys = [
  'expo',
  'expo-font',
  'expo-sqlite',
  'expo-status-bar',
  '@expo/vector-icons',
  '@expo-google-fonts/inter',
  'react',
  'react-dom',
  'react-native',
  'react-native-safe-area-context',
  'typescript'
];

for (const key of trackedKeys) {
  const regex = new RegExp(`^\\s*["']?${key}["']?:\\s*(.+)$`, 'm');
  const match = content.match(regex);
  console.log(`- ${key}: ${match?.[1]?.trim() ?? '(not found)'}`);
}

if (sdkArg) {
  const nextVersion = sdkArg.slice('--expo='.length).trim();
  if (!nextVersion) {
    console.error('Uso: pnpm upgrade:expo -- --expo=~59.0.0');
    process.exit(1);
  }
  const updated = content.replace(
    /^(\s*expo:\s*).+$/m,
    `$1${nextVersion}`
  );
  fs.writeFileSync(workspaceFile, updated, 'utf8');
  console.log(`\nActualizado expo en pnpm-workspace.yaml -> ${nextVersion}`);
  console.log('Siguientes pasos recomendados:');
  console.log('  1. pnpm install');
  console.log('  2. pnpm --filter @framework/base-expo exec npx expo install --fix');
  console.log('  3. pnpm typecheck && pnpm test');
} else {
  console.log('\nPara actualizar la versión de Expo de forma centralizada:');
  console.log('  node scripts/upgrade-expo.mjs --expo=~59.0.0');
  console.log('Todas las apps que usen "catalog:" heredan automáticamente la nueva versión.');
}

