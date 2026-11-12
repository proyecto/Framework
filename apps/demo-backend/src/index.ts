import { BASE_SERVER_MODULE } from '@framework/base-domain';
import { createLibSqlDriverFromEnv } from '@framework/data-libsql';
import { EXAMPLE_SERVER_MODULE } from '@framework/example-domain';
import { createFrameworkServer } from '@framework/server';

/**
 * Punto de entrada del servidor Node.js reutilizable (`apps/demo-backend`).
 *
 * Muestra la separación total entre lógica de servidor y almacenamiento:
 * - Con `STORAGE_DRIVER=local` (por defecto) usa un fichero SQLite/libSQL en `./data/`.
 * - Con `STORAGE_DRIVER=turso` + `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` apunta
 *   directamente a la nube de Turso sin cambiar ni una línea de este archivo.
 */
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const driver = createLibSqlDriverFromEnv(process.env);

const server = await createFrameworkServer({
  port,
  host,
  driver,
  apps: [EXAMPLE_SERVER_MODULE, BASE_SERVER_MODULE]
});

const url = await server.start();
console.log(
  `[demo-backend] Servidor listo en ${url} (driver: ${driver.driverName})`
);

/** Cierre ordenado (Graceful Shutdown) cerrando sockets HTTP y conexión libSQL/Turso. */
const shutdown = async () => {
  console.log('\n[demo-backend] Cerrando servidor...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
