import type { EntitlementStatus, ISqlDriver, SqlMigration, UserPlan } from '@framework/core';

export const SERVER_MIGRATIONS: SqlMigration[] = [
  {
    version: 100,
    name: 'create_framework_server_tables',
    up: [
      `CREATE TABLE IF NOT EXISTS _fw_server_entitlements (
        app_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        updated_at TEXT NOT NULL,
        PRIMARY KEY (app_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS _fw_server_records (
        app_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        entity TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        server_seq INTEGER NOT NULL,
        PRIMARY KEY (app_id, user_id, entity, record_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_fw_server_records_cursor
       ON _fw_server_records (app_id, user_id, server_seq)`
    ]
  }
];

export interface IServerEntitlementProvider {
  getEntitlement(appId: string, userId: string): Promise<EntitlementStatus>;
  setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>;
}

export class SqlEntitlementProvider implements IServerEntitlementProvider {
  constructor(private readonly driver: ISqlDriver) {}

  async getEntitlement(appId: string, userId: string): Promise<EntitlementStatus> {
    const rows = await this.driver.query<{ plan: string; updated_at: string }>(
      `SELECT plan, updated_at
       FROM _fw_server_entitlements
       WHERE app_id = ? AND user_id = ?
       LIMIT 1`,
      [appId, userId]
    );
    const row = rows[0];
    const plan: UserPlan = row?.plan === 'pro' ? 'pro' : 'free';
    return {
      appId,
      userId,
      plan,
      cloudSyncAllowed: plan === 'pro',
      updatedAt: row?.updated_at ?? new Date(0).toISOString()
    };
  }

  async setEntitlement(
    appId: string,
    userId: string,
    plan: UserPlan
  ): Promise<EntitlementStatus> {
    const updatedAt = new Date().toISOString();
    await this.driver.execute(
      `INSERT INTO _fw_server_entitlements (app_id, user_id, plan, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(app_id, user_id) DO UPDATE SET
         plan = excluded.plan,
         updated_at = excluded.updated_at`,
      [appId, userId, plan, updatedAt]
    );
    return {
      appId,
      userId,
      plan,
      cloudSyncAllowed: plan === 'pro',
      updatedAt
    };
  }
}

