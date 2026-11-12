import {
  CloudEntitlementError,
  LastWriteWinsConflictStrategy,
  ValidationError,
  type IConflictResolutionStrategy,
  type ISqlDriver,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncRecordEnvelope
} from '@framework/core';
import type { IServerEntitlementProvider } from './schema.js';

interface ServerRecordRow {
  entity: string;
  record_id: string;
  payload_json: string;
  version: number;
  updated_at: string;
  deleted_at: string | null;
  server_seq: number;
}

/**
 * Patrón: **Application Service + Strategy (`IConflictResolutionStrategy`)**.
 *
 * Concentra toda la lógica de sincronización multi-dispositivo en la nube, completamente
 * desacoplada del protocolo HTTP:
 * 1. Valida que el usuario tenga plan Pro autorizado para usar almacenamiento en la nube.
 * 2. Ejecuta push + pull dentro de una transacción SQL atómica en `ISqlDriver` (libSQL local o Turso).
 * 3. Aplica `IConflictResolutionStrategy` (por defecto Last-Write-Wins) evitando sobrescribir
 *    cambios más recientes provenientes de otro dispositivo.
 * 4. Devuelve cambios posteriores a `sinceCursor`, omitiendo los que este cliente acaba de subir
 *    (`acceptedKeys`) para evitar eco innecesario.
 */
export class CloudSyncService {
  constructor(
    private readonly driver: ISqlDriver,
    private readonly entitlements: IServerEntitlementProvider,
    private readonly conflictStrategy: IConflictResolutionStrategy = new LastWriteWinsConflictStrategy()
  ) {}

  /** Ejecuta un ciclo completo de subida y bajada incremental para `(appId, userId)`. */
  async sync(
    appId: string,
    request: Partial<SyncPushRequest>
  ): Promise<SyncPullResponse> {
    const userId = request.userId?.trim();
    if (!userId) {
      throw new ValidationError('El campo "userId" es obligatorio para sincronizar.');
    }

    const entitlement = await this.entitlements.getEntitlement(appId, userId);
    if (!entitlement.cloudSyncAllowed) {
      throw new CloudEntitlementError(
        'El usuario no tiene un plan Pro activo para usar la nube.'
      );
    }

    const sinceSeq = request.sinceCursor ? Number(request.sinceCursor) || 0 : 0;
    const incomingChanges = Array.isArray(request.changes) ? request.changes : [];

    return this.driver.transaction<SyncPullResponse>(async (tx) => {
      // Calcula el mayor cursor secuencial actual de este usuario en esta aplicación.
      const maxRows = await tx.query<{ max_seq: number }>(
        `SELECT COALESCE(MAX(server_seq), 0) AS max_seq
         FROM _fw_server_records
         WHERE app_id = ? AND user_id = ?`,
        [appId, userId]
      );
      let nextSeq = Number(maxRows[0]?.max_seq ?? 0);
      let acceptedCount = 0;
      const acceptedKeys = new Set<string>();

      for (const change of incomingChanges) {
        if (!change.entity || !change.recordId) continue;

        const existingRows = await tx.query<ServerRecordRow>(
          `SELECT entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
           FROM _fw_server_records
           WHERE app_id = ? AND user_id = ? AND entity = ? AND record_id = ?
           LIMIT 1`,
          [appId, userId, change.entity, change.recordId]
        );
        const existing = existingRows[0];

        const shouldAccept = this.conflictStrategy.shouldAcceptIncoming(
          { updatedAt: change.updatedAt, version: change.version },
          existing
            ? { updatedAt: existing.updated_at, version: Number(existing.version) }
            : null,
          { acceptEqualVersion: true }
        );

        if (shouldAccept) {
          nextSeq += 1;
          acceptedCount += 1;
          acceptedKeys.add(`${change.entity}:${change.recordId}`);

          await tx.execute(
            `INSERT INTO _fw_server_records (
               app_id, user_id, entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(app_id, user_id, entity, record_id) DO UPDATE SET
               payload_json = excluded.payload_json,
               version = excluded.version,
               updated_at = excluded.updated_at,
               deleted_at = excluded.deleted_at,
               server_seq = excluded.server_seq`,
            [
              appId,
              userId,
              change.entity,
              change.recordId,
              JSON.stringify(change.payload),
              change.version,
              change.updatedAt,
              change.deletedAt ?? null,
              nextSeq
            ]
          );
        }
      }

      // Obtiene todos los registros modificados después del cursor conocido por el cliente.
      const changedRows = await tx.query<ServerRecordRow>(
        `SELECT entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
         FROM _fw_server_records
         WHERE app_id = ? AND user_id = ? AND server_seq > ?
         ORDER BY server_seq ASC`,
        [appId, userId, sinceSeq]
      );

      const changesToPull: SyncRecordEnvelope[] = changedRows
        .filter((row) => !acceptedKeys.has(`${row.entity}:${row.record_id}`))
        .map((row) => ({
          entity: row.entity,
          recordId: row.record_id,
          payload: JSON.parse(row.payload_json) as Record<string, unknown>,
          version: Number(row.version),
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at
        }));

      return {
        serverCursor: String(nextSeq),
        acceptedCount,
        changes: changesToPull
      };
    });
  }

  /** Lista registros activos (no marcados como borrados) almacenados en la nube para una entidad. */
  async listEntities(
    appId: string,
    userId: string,
    entityName: string
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.driver.query<Pick<ServerRecordRow, 'payload_json'>>(
      `SELECT payload_json
       FROM _fw_server_records
       WHERE app_id = ? AND user_id = ? AND entity = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [appId, userId, entityName]
    );
    return rows.map((row) => JSON.parse(row.payload_json) as Record<string, unknown>);
  }
}

