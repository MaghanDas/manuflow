const request = require("supertest");
const { createApp } = require("./server");

describe("notifications service", () => {
  let app;
  let httpServer;

  beforeEach(() => {
    ({ app, httpServer } = createApp());
  });

  afterEach((done) => {
    if (httpServer.listening) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  test("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("POST /broadcast/order-status requires orderId and status", async () => {
    const res = await request(app).post("/broadcast/order-status").send({});
    expect(res.status).toBe(400);
  });

  test("POST /broadcast/order-status accepts a valid payload", async () => {
    const res = await request(app).post("/broadcast/order-status").send({
      orderId: 42,
      clientId: 7,
      status: "IN_PROGRESS",
      previousStatus: "PENDING",
      note: "Started machining",
      updatedAt: new Date().toISOString(),
    });
    expect(res.status).toBe(202);
    expect(res.body.delivered).toBe(true);
    expect(res.body.event.orderId).toBe(42);
  });
});
