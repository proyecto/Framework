import type { IConflictResolutionStrategy, SyncVersionComparable } from './storage.js';

/**
 * Patrón: **Strategy (Resolución de conflictos LWW · Last-Write-Wins)**.
 *
 * Unifica en una única implementación la regla de desempate empleada tanto por:
 * - El cliente (`HybridSyncRepository`) al aplicar cambios remotos descargados (pull).
 * - El servidor (`CloudSyncService`) al recibir cambios locales subidos (push).
 *
 * Regla determinista:
 * 1. Si no existe registro previo, se acepta siempre el entrante.
 * 2. Gana el timestamp ISO-8601 `updatedAt` más reciente.
 * 3. Ante empate exacto de timestamp en el mismo milisegundo, desempata `version`
 *    (en servidor suele usarse `acceptEqualVersion: true` para permitir idempotencia
 *    de reintentos con el mismo número de versión).
 */
export class LastWriteWinsConflictStrategy implements IConflictResolutionStrategy {
  readonly name = 'last-write-wins';

  shouldAcceptIncoming(
    incoming: SyncVersionComparable,
    existing: SyncVersionComparable | null | undefined,
    options?: { acceptEqualVersion?: boolean }
  ): boolean {
    if (!existing) return true;

    if (incoming.updatedAt > existing.updatedAt) {
      return true;
    }

    if (incoming.updatedAt < existing.updatedAt) {
      return false;
    }

    return options?.acceptEqualVersion
      ? incoming.version >= existing.version
      : incoming.version > existing.version;
  }
}

