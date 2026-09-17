/** Shared POC API envelope (hathor-poc.response/1). */

export type ApiState = "ok" | "degraded" | "unavailable" | "error";

export type ApiSource = "live-cli" | "fixture" | "application";

export interface ApiDiagnostic {
  code: string;
  message: string;
  remediation?: string;
}

export interface ApiEnvelope<T> {
  schema: "hathor-poc.response/1";
  requestId: string;
  generatedAt: string;
  source: ApiSource;
  state: ApiState;
  data: T | null;
  diagnostics: ApiDiagnostic[];
}

export function makeEnvelope<T>(
  partial: Omit<ApiEnvelope<T>, "schema" | "generatedAt"> & { generatedAt?: string },
): ApiEnvelope<T> {
  return {
    schema: "hathor-poc.response/1",
    generatedAt: partial.generatedAt ?? new Date().toISOString(),
    requestId: partial.requestId,
    source: partial.source,
    state: partial.state,
    data: partial.data,
    diagnostics: partial.diagnostics,
  };
}
