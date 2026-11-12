import {
  FrameworkError,
  getErrorMessage,
  type EntitlementStatus,
  type IRemoteSyncTransport,
  type SyncPullResponse,
  type SyncPushRequest,
  type UserPlan
} from '@framework/core';

export interface HttpSyncTransportOptions {
  baseUrl: string;
  /** Permite inyectar un `fetch` personalizado (ej. testing en proceso o auth interceptor). */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Patrón: **Adapter / Anti-Corruption Layer** sobre HTTP + `fetch`.
 *
 * Traduce el contrato abstracto `IRemoteSyncTransport` a llamadas REST JSON contra
 * `@framework/server`, gestionando timeouts con `AbortController` y mapeando códigos HTTP
 * (`402 -> ENTITLEMENT_REQUIRED`, red -> `NETWORK_ERROR`) a `FrameworkError`.
 */
export class HttpSyncTransport implements IRemoteSyncTransport {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: HttpSyncTransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  private async requestJson<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init.headers ?? {})
        },
        signal: controller.signal
      });

      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};

      if (!response.ok) {
        const message =
          typeof parsed.error === 'string'
            ? parsed.error
            : `Error HTTP ${response.status} al comunicar con la nube.`;
        const code = response.status === 402 ? 'ENTITLEMENT_REQUIRED' : 'NETWORK_ERROR';
        throw new FrameworkError(code, message, response.status);
      }

      return parsed as TResponse;
    } catch (error) {
      if (error instanceof FrameworkError) throw error;
      throw new FrameworkError(
        'NETWORK_ERROR',
        `No se pudo conectar con la nube (${getErrorMessage(error)}).`,
        503
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async checkEntitlement(appId: string, userId: string): Promise<EntitlementStatus> {
    const encodedApp = encodeURIComponent(appId);
    const encodedUser = encodeURIComponent(userId);
    return this.requestJson<EntitlementStatus>(
      `/api/v1/apps/${encodedApp}/entitlements?userId=${encodedUser}`,
      { method: 'GET' }
    );
  }

  async setEntitlement(
    appId: string,
    userId: string,
    plan: UserPlan
  ): Promise<EntitlementStatus> {
    const encodedApp = encodeURIComponent(appId);
    return this.requestJson<EntitlementStatus>(`/api/v1/apps/${encodedApp}/entitlements`, {
      method: 'POST',
      body: JSON.stringify({ userId, plan })
    });
  }

  async sync(request: SyncPushRequest): Promise<SyncPullResponse> {
    const encodedApp = encodeURIComponent(request.appId);
    return this.requestJson<SyncPullResponse>(`/api/v1/apps/${encodedApp}/sync`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }
}
