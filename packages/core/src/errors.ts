export type FrameworkErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ENTITLEMENT_REQUIRED'
  | 'SYNC_FAILED'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR';

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

export class ValidationError extends FrameworkError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class CloudEntitlementError extends FrameworkError {
  constructor(message = 'Se requiere suscripción Pro para sincronizar datos en la nube.') {
    super('ENTITLEMENT_REQUIRED', message, 402);
    this.name = 'CloudEntitlementError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

