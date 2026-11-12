/**
 * Punto de entrada público de `@framework/core`.
 * Agrupa exclusivamente contratos puros MVC, interfaces de datos/driver, errores,
 * estrategias de conflicto y utilidades de concurrencia sin dependencias externas.
 */
export * from './errors.js';
export * from './mvc.js';
export * from './storage.js';
export * from './server.js';
export * from './sqlUtils.js';
export * from './syncStrategy.js';
