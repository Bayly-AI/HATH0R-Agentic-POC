import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { makeEnvelope } from "../shared/contracts/api-envelope.js";

const PORT = Number(process.env.POC_API_PORT ?? 3001);
const HOST = process.env.POC_API_HOST ?? "localhost";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    const body = makeEnvelope<{ status: "ok"; service: string }>({
      requestId: randomUUID(),
      source: "application",
      state: "ok",
      data: { status: "ok", service: "hathor-poc-adapter" },
      diagnostics: [],
    });
    res.status(200).json(body);
  });

  return app;
}

function main() {
  const app = createApp();
  // Loopback only by default — do not bind 0.0.0.0.
  app.listen(PORT, HOST, () => {
    console.info(`hathor-poc adapter listening on http://${HOST}:${PORT}`);
  });
}

const isDirect = process.argv[1]?.includes("main.ts") || process.argv[1]?.includes("main.js");
if (isDirect) {
  main();
}
