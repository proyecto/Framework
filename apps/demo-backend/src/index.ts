import { createLibSqlDriverFromEnv } from '@framework/data-libsql';
import { EXAMPLE_SERVER_MODULE } from '@framework/example-domain';
import { createFrameworkServer } from '@framework/server';

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

const driver = createLibSqlDriverFromEnv(process.env);

const server = await createFrameworkServer({
  port,
  host,
  driver,
  apps: [EXAMPLE_SERVER_MODULE]
});

const url = await server.start();
console.log(
  `[demo-backend] Servidor listo en ${url} (driver: ${driver.driverName})`
);

const shutdown = async () => {
  console.log('\n[demo-backend] Cerrando servidor...');
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

