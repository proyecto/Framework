import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  execAsync: vi.fn(async (_sql: string) => {}),
  runAsync: vi.fn(async (_sql: string, _params?: unknown[]) => ({
    changes: 1,
    lastInsertRowId: 7
  })),
  getAllAsync: vi.fn(async (_sql: string, _params?: unknown[]) => [{ ok: 1 }]),
  withExclusiveTransactionAsync: vi.fn<
    (cb: (txn: { runAsync: any; getAllAsync: any }) => Promise<void>) => Promise<void>
  >(async (cb) => {
    await cb({
      runAsync: mockDb.runAsync,
      getAllAsync: mockDb.getAllAsync
    });
  }),
  withTransactionAsync: vi.fn(async (cb: () => Promise<void>) => {
    await cb();
  }),
  closeAsync: vi.fn(async () => {})
};

const openDatabaseAsyncMock = vi.fn(async (_name: string) => mockDb);

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: openDatabaseAsyncMock
}));

describe('ExpoSqliteDriver adapter boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes WAL pragmas once, normalizes boolean parameters and recovers from init errors', async () => {
    const { ExpoSqliteDriver } = await import('./index.js');

    mockDb.execAsync.mockRejectedValueOnce(new Error('transient lock'));
    const driver = new ExpoSqliteDriver('test.db');

    await expect(driver.initialize()).rejects.toThrow(/transient lock/);

    // Tras un fallo inicial, el siguiente intento vuelve a ejecutar initialize() con éxito.
    await driver.initialize();
    await driver.initialize();
    expect(openDatabaseAsyncMock).toHaveBeenCalledTimes(1);
    expect(mockDb.execAsync).toHaveBeenCalledTimes(2);
    expect(mockDb.execAsync.mock.calls[1]?.[0]).toContain('PRAGMA journal_mode = WAL');

    const execResult = await driver.execute('INSERT INTO t VALUES (?, ?)', [true, false]);
    expect(execResult).toEqual({ rowsAffected: 1, lastInsertRowId: 7 });
    expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO t VALUES (?, ?)', [1, 0]);

    const rows = await driver.query<{ ok: number }>('SELECT ? AS flag', [true]);
    expect(rows).toEqual([{ ok: 1 }]);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT ? AS flag', [1]);

    await driver.close();
    expect(mockDb.closeAsync).toHaveBeenCalledTimes(1);
  });

  it('uses exclusive transactions when available and falls back safely for older Expo SDKs', async () => {
    const { ExpoSqliteDriver } = await import('./index.js');
    const driver = new ExpoSqliteDriver('tx.db');

    const exclusiveResult = await driver.transaction(async (tx) => {
      await tx.execute('UPDATE t SET active = ?', [true]);
      return 'exclusive-ok';
    });
    expect(exclusiveResult).toBe('exclusive-ok');
    expect(mockDb.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);

    const savedExclusive = mockDb.withExclusiveTransactionAsync;
    (mockDb as { withExclusiveTransactionAsync?: unknown }).withExclusiveTransactionAsync = undefined;

    try {
      const fallbackResult = await driver.transaction(async (tx) => {
        await tx.execute('UPDATE t SET active = ?', [false]);
        return 'fallback-ok';
      });
      expect(fallbackResult).toBe('fallback-ok');
      expect(mockDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    } finally {
      mockDb.withExclusiveTransactionAsync = savedExclusive;
    }
  });
});
