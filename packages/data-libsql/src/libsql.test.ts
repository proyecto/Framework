import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLibSqlDriver, createLibSqlDriverFromEnv } from './index.js';

describe('LibSqlDriver', () => {
  it('executes queries and transactions against a local libSQL database file', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-libsql-'));
    const dbPath = path.join(tmpDir, 'test.db');

    const driver = createLibSqlDriver({ mode: 'local', url: `file:${dbPath}` });
    try {
      await driver.initialize();
      await driver.execute(
        'CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, body TEXT NOT NULL, active INTEGER NOT NULL)'
      );

      await driver.transaction(async (tx) => {
        await tx.execute('INSERT INTO notes (id, body, active) VALUES (?, ?, ?)', [
          'n1',
          'Hola libSQL',
          true
        ]);
      });

      const rows = await driver.query<{ id: string; body: string; active: number }>(
        'SELECT id, body, active FROM notes WHERE id = ?',
        ['n1']
      );
      expect(rows).toEqual([{ id: 'n1', body: 'Hola libSQL', active: 1 }]);
    } finally {
      await driver.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('requires Turso credentials when STORAGE_DRIVER=turso', () => {
    expect(() =>
      createLibSqlDriverFromEnv({ STORAGE_DRIVER: 'turso' })
    ).toThrow(/Turso/i);
  });
});

