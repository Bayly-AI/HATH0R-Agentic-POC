import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/main";

describe("GET /api/health", () => {
  it("returns hathor-poc.response/1 ok envelope", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.schema).toBe("hathor-poc.response/1");
    expect(res.body.state).toBe("ok");
    expect(res.body.source).toBe("application");
    expect(res.body.data?.status).toBe("ok");
    expect(typeof res.body.requestId).toBe("string");
  });
});
