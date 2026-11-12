/**
 * Punto de entrada de `@framework/data`: implementaciones de almacenamiento local-first,
 * migraciones SQL, adaptadores clave-valor y motor de sincronización hacia la nube.
 */
export * from './migrations.js';
export * from './kv.js';
export * from './entityStore.js';
export * from './httpTransport.js';
export * from './hybridRepository.js';
