/**
 * Punto de entrada de `@framework/data`: implementaciones de almacenamiento local-first,
 * migraciones SQL, adaptadores clave-valor, metadatos de sync y repositorio híbrido.
 */
export * from './migrations.js';
export * from './kv.js';
export * from './entityStore.js';
export * from './httpTransport.js';
export * from './syncMetadata.js';
export * from './hybridRepository.js';
