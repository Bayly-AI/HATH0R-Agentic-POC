/**
 * HTTP routes for health and hathor capabilities (P5).
 */

import { Router, type Request, type Response } from "express";
import {
  buildCapabilityDocument,
  defaultAdapterSupport,
  makeEnvelope,
  type AdapterSupport,
  type CapabilityDocument,
} from "../../shared/contracts/index.js";
import { resolveHathorExecutable, HathorSpawnError } from "../hathor/runner.js";
import {
  buildAudit,
  createRequestContext,
  type RequestAudit,
  type RequestContext,
} from "../observability/request-context.js";

export interface ApiDeps {
  /** Override adapter support flags (tests). */
  adapterSupport?: AdapterSupport;
  /** Probe whether the hath0r binary is resolvable. */
  probeCliPresent?: () => boolean;
}

type Locals = {
  requestContext?: RequestContext;
};

function ctxOf(res: Response): RequestContext {
  const locals = res.locals as Locals;
  if (!locals.requestContext) {
    // Fallback if middleware skipped (should not happen when wired).
    locals.requestContext = createRequestContext({ method: "GET", path: "", originalUrl: "" });
  }
  return locals.requestContext;
}

function sendEnvelope<T>(
  res: Response,
  envelope: ReturnType<typeof makeEnvelope<T>>,
  auditExtras: { commandKey?: string | null; exitClass?: RequestAudit["exitClass"] } = {},
): void {
  const ctx = ctxOf(res);
  const requestId = envelope.requestId || ctx.requestId;
  const base = { ...envelope, requestId };
  const body = {
    ...base,
    audit: buildAudit(ctx, {
      body: base,
      commandKey: auditExtras.commandKey ?? null,
      exitClass: auditExtras.exitClass ?? "none",
    }),
  };
  res.setHeader("X-Request-Id", requestId);
  res.status(200).json(body);
}

export function defaultProbeCliPresent(): boolean {
  try {
    resolveHathorExecutable();
    return true;
  } catch (err) {
    if (err instanceof HathorSpawnError) return false;
    return false;
  }
}

export function createApiRouter(deps: ApiDeps = {}): Router {
  const router = Router();
  const probeCli = deps.probeCliPresent ?? defaultProbeCliPresent;
  const supportBase = deps.adapterSupport ?? defaultAdapterSupport();

  router.use((req, res, next) => {
    const ctx = createRequestContext(req);
    (res.locals as Locals).requestContext = ctx;
    res.setHeader("X-Request-Id", ctx.requestId);
    next();
  });

  /**
   * GET /api/health — application liveness; no CLI dependency.
   */
  router.get("/health", (_req: Request, res: Response) => {
    const ctx = ctxOf(res);
    const envelope = makeEnvelope<{ status: "ok"; service: string }>({
      requestId: ctx.requestId,
      source: "application",
      state: "ok",
      data: { status: "ok", service: "hathor-poc-adapter" },
      diagnostics: [],
    });
    sendEnvelope(res, envelope, { commandKey: null, exitClass: "none" });
  });

  /**
   * GET /api/hathor/capabilities — adapter capability document.
   * Capability row states come from adapter support; missing CLI only affects
   * envelope state / diagnostics (not optimistic "implemented" flips for framework rows).
   */
  router.get("/hathor/capabilities", (_req: Request, res: Response) => {
    const ctx = ctxOf(res);
    const cliPresent = probeCli();
    const generatedAt = new Date().toISOString();
    const document: CapabilityDocument = buildCapabilityDocument(supportBase, generatedAt);

    const diagnostics = cliPresent
      ? []
      : [
          {
            code: "CLI_UNAVAILABLE",
            message: "hath0r executable was not found on PATH.",
            remediation: "Install HATH0R-CLI and ensure `hath0r` is on PATH.",
          },
        ];

    // Envelope state: ok when CLI present; degraded when adapter is ready but CLI missing.
    const state = cliPresent ? "ok" : "degraded";

    const envelope = makeEnvelope<CapabilityDocument & { cliPresent: boolean }>({
      requestId: ctx.requestId,
      source: "application",
      state,
      data: { ...document, cliPresent },
      diagnostics,
    });

    sendEnvelope(res, envelope, {
      commandKey: "capabilities",
      exitClass: cliPresent ? "success" : "spawn_error",
    });
  });

  return router;
}
