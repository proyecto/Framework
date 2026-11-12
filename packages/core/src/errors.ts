/**
 * Códigos semánticos de error compartidos entre Modelo, Repositorio, Servidor HTTP y Vistas.
 * Permiten reaccionar en capas superiores sin acoplarse a excepciones concretas de HTTP o SQLite.
 */
export type FrameworkErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ENTITLEMENT_REQUIRED'
  | 'SYNC_FAILED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR';

/**
 * Error base estructurado del framework.
 * Incluye `code` para lógica programática y `statusCode` para que la capa HTTP del servidor
 * pueda traducirlo automáticamente a un código de respuesta REST coherente.
 */
export class FrameworkError extends Error {
  readonly code: FrameworkErrorCode;
  readonly statusCode: number;

  constructor(code: FrameworkErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = 'FrameworkError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Error de validación de reglas de negocio o entrada de usuario (HTTP 400).
 * Lanzado principalmente desde el Modelo o al parsear payloads en el backend.
 */
export class ValidationError extends FrameworkError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Error emitido cuando un usuario sin suscripción Pro activa intenta usar
 * funcionalidades de sincronización en la nube (HTTP 402 Payment Required).
 * Las vistas capturan este evento vía `ViewEvent ('upgrade-required')` para abrir el flujo de mejora.
 */
export class CloudEntitlementError extends FrameworkError {
  constructor(message = 'Se requiere suscripción Pro para sincronizar datos en la nube.') {
    super('ENTITLEMENT_REQUIRED', message, 402);
    this.name = 'CloudEntitlementError';
  }
}

/**
 * Utilidad segura para extraer un mensaje legible desde valores `unknown` capturados en `catch`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
