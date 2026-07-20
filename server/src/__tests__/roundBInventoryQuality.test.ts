import request from "supertest";
import app from "../app";
import prisma from "../utils/prisma";
import { updateReagentAggregates } from "../services/reagentAggregates";

describe("Round B inventory quality functional closure", () => {
  const namespace = `round-b-${Date.now()}`;
  const adminToken = globalThis.testHelpers.generateToken(`${namespace}-admin`, "ADMIN");
  const managerToken = globalThis.testHelpers.generateToken(
    `${namespace}-manager`,
    "MANAGER",
  );
  const userToken = globalThis.testHelpers.generateToken(`${namespace}-user`, "USER");
  const readonlyToken = globalThis.testHelpers.generateToken(
    `${namespace}-readonly`,
    "READONLY",
  );

  let supplierId: string;
  let reagentId: string;

  const createBatch = async ({
    suffix,
    quantity = 10,
    status = "ACTIVE",
    qcStatus = "PENDING",
    coaDocumentUrl = null,
    expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }: {
    suffix: string;
    quantity?: number;
    status?: string;
    qcStatus?: string;
    coaDocumentUrl?: string | null;
    expiryDate?: Date;
  }) =>
    prisma.reagentBatch.create({
      data: {
        reagentId,
        batchNumber: `${namespace}-${suffix}`,
        initialQuantity: quantity,
        currentQuantity: quantity,
        receivedDate: new Date(),
        expiryDate,
        status,
        qcStatus,
        coaDocumentUrl,
      },
    });

  beforeAll(async () => {
    const supplier = await prisma.supplier.create({
      data: { name: `${namespace}-supplier` },
    });
    supplierId = supplier.id;

    const reagent = await prisma.reagent.create({
      data: {
        name: `${namespace}-reagent`,
        catalogNumber: `${namespace}-catalog`,
        supplierId,
        minStockLevel: 9,
        maxStockLevel: 12,
        totalQuantity: 0,
      },
    });
    reagentId = reagent.id;
  });

  afterEach(async () => {
    await prisma.activityLog.deleteMany({
      where: { details: { contains: namespace } },
    });
    await prisma.inventoryTransaction.deleteMany({ where: { reagentId } });
    await prisma.dispenseEvent.deleteMany({ where: { reagentId } });
    await prisma.reagentBatch.deleteMany({ where: { reagentId } });
    await prisma.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity: 0,
        activeBatchesCount: 0,
        nearestExpiryDate: null,
        currentStockStatus: "OUT_OF_STOCK",
        monthsOfStock: 0,
        averageMonthlyUsage: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany({
      where: { details: { contains: namespace } },
    });
    await prisma.inventoryTransaction.deleteMany({ where: { reagentId } });
    await prisma.dispenseEvent.deleteMany({ where: { reagentId } });
    await prisma.reagentBatch.deleteMany({ where: { reagentId } });
    await prisma.reagent.delete({ where: { id: reagentId } });
    await prisma.supplier.delete({ where: { id: supplierId } });
  });

  it("links a COA to the exact batch, releases QA, and exposes authoritative availability", async () => {
    const batch = await createBatch({ suffix: "qa" });
    await updateReagentAggregates(reagentId);

    await request(app)
      .post(`/api/batches/${batch.id}/quality-decision`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientRequestId: `${namespace}-qa-without-coa`,
        decision: "APPROVE",
        notes: "cannot approve without evidence",
      })
      .expect(409);

    await request(app)
      .post(`/api/batches/${batch.id}/coa`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        clientRequestId: `${namespace}-coa-user`,
        documentUrl: "/api/files/download/coa.pdf",
      })
      .expect(403);

    const coa = await request(app)
      .post(`/api/batches/${batch.id}/coa`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        clientRequestId: `${namespace}-coa-admin`,
        documentUrl: "/api/files/download/coa.pdf",
      })
      .expect(200);
    expect(coa.body.data.batchId).toBe(batch.id);
    expect(coa.body.data.idempotentReplay).toBe(false);

    const approved = await request(app)
      .post(`/api/batches/${batch.id}/quality-decision`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientRequestId: `${namespace}-qa-approved`,
        decision: "APPROVE",
        notes: "COA reviewed",
      })
      .expect(200);
    expect(approved.body.data.batch.qcStatus).toBe("APPROVED");
    expect(approved.body.data.availabilityState).toBe("released");
    expect(approved.body.data.canDispense).toBe(true);

    const coaReplay = await request(app)
      .post(`/api/batches/${batch.id}/coa`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        clientRequestId: `${namespace}-coa-admin`,
        documentUrl: "/api/files/download/coa.pdf",
      })
      .expect(200);
    expect(coaReplay.body.data.idempotentReplay).toBe(true);

    const qaReplay = await request(app)
      .post(`/api/batches/${batch.id}/quality-decision`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientRequestId: `${namespace}-qa-approved`,
        decision: "APPROVE",
        notes: "COA reviewed",
      })
      .expect(200);
    expect(qaReplay.body.data.idempotentReplay).toBe(true);

    const quality = await request(app)
      .get(`/api/batches/quality?reagentId=${reagentId}`)
      .set("Authorization", `Bearer ${readonlyToken}`)
      .expect(200);
    expect(quality.body.data).toEqual([
      expect.objectContaining({
        id: batch.id,
        availableQuantity: 10,
        availabilityState: "released",
        canDispense: true,
        blockedReasons: [],
        coa: { url: "/api/files/download/coa.pdf" },
      }),
    ]);

    const current = await request(app)
      .get(`/api/inventory/current?reagentId=${reagentId}`)
      .set("Authorization", `Bearer ${readonlyToken}`)
      .expect(200);
    expect(current.body.data).toEqual([
      expect.objectContaining({
        reagentId,
        physicalQuantity: 10,
        availableQuantity: 10,
        pendingQaQuantity: 0,
      }),
    ]);

    await request(app)
      .post(`/api/batches/${batch.id}/quality-decision`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        clientRequestId: `${namespace}-qa-hold`,
        decision: "HOLD",
        notes: "temporary investigation hold",
      })
      .expect(200);
    const [heldReagent, heldCurrent] = await Promise.all([
      prisma.reagent.findUniqueOrThrow({ where: { id: reagentId } }),
      request(app)
        .get(`/api/inventory/current?reagentId=${reagentId}`)
        .set("Authorization", `Bearer ${readonlyToken}`),
    ]);
    expect(heldReagent.totalQuantity).toBe(10);
    expect(heldCurrent.body.data).toEqual([
      expect.objectContaining({
        physicalQuantity: 10,
        availableQuantity: 0,
        heldQuantity: 10,
      }),
    ]);
  });

  it("rejects pending, held, rejected, expired, and excessive stock-out", async () => {
    const pending = await createBatch({ suffix: "pending", quantity: 4 });
    const held = await createBatch({
      suffix: "held",
      status: "ON_HOLD",
      qcStatus: "REQUIRES_REVIEW",
      coaDocumentUrl: "/api/files/download/held.pdf",
    });
    const rejected = await createBatch({
      suffix: "rejected",
      status: "ON_HOLD",
      qcStatus: "REJECTED",
      coaDocumentUrl: "/api/files/download/rejected.pdf",
    });
    const expired = await createBatch({
      suffix: "expired",
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/expired.pdf",
      expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    const released = await createBatch({
      suffix: "released",
      quantity: 2,
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/released.pdf",
    });

    const cases = [
      [pending.id, `${namespace}-pending`, "PENDING_QA"],
      [held.id, `${namespace}-held`, "BATCH_ON_HOLD"],
      [rejected.id, `${namespace}-rejected`, "QA_REJECTED"],
      [expired.id, `${namespace}-expired`, "BATCH_EXPIRED"],
    ];
    for (const [batchId, clientRequestId, reason] of cases) {
      const response = await request(app)
        .post("/api/dispense")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ clientRequestId, reagentId, batchId, quantity: 1, purpose: "lab" })
        .expect(409);
      expect(response.body.code).toBe("BATCH_UNAVAILABLE");
      expect(response.body.blockedReasons).toContain(reason);
    }

    const excessive = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        clientRequestId: `${namespace}-excessive`,
        reagentId,
        batchId: released.id,
        quantity: 3,
        purpose: "lab",
      })
      .expect(409);
    expect(excessive.body.code).toBe("INSUFFICIENT_STOCK");
    expect(excessive.body.availableQuantity).toBe(2);
  });

  it("commits batch, event, movement, audit, aggregate, and replenishment atomically", async () => {
    const batch = await createBatch({
      suffix: "atomic",
      quantity: 10,
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/atomic.pdf",
    });
    await updateReagentAggregates(reagentId);

    const response = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        clientRequestId: `${namespace}-atomic-request`,
        reagentId,
        batchId: batch.id,
        quantity: 3,
        scanMethod: "MANUAL",
        purpose: "laboratory validation",
      })
      .expect(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        idempotentReplay: false,
        batch: expect.objectContaining({
          id: batch.id,
          beforeQuantity: 10,
          currentQuantity: 7,
        }),
        inventory: expect.objectContaining({
          reagentId,
          physicalQuantity: 7,
          availableQuantity: 7,
        }),
        replenishment: expect.objectContaining({ suggestedQuantity: 5 }),
      }),
    );

    const [storedBatch, reagent, movements, events, activities] = await Promise.all([
      prisma.reagentBatch.findUniqueOrThrow({ where: { id: batch.id } }),
      prisma.reagent.findUniqueOrThrow({ where: { id: reagentId } }),
      prisma.inventoryTransaction.findMany({
        where: {
          reagentId,
          sourceType: "dispense_request",
          sourceId: `${namespace}-atomic-request`,
        },
      }),
      prisma.dispenseEvent.findMany({ where: { batchId: batch.id } }),
      prisma.activityLog.findMany({
        where: { action: "stock_dispensed", entityId: batch.id },
      }),
    ]);
    expect(storedBatch.currentQuantity).toBe(7);
    expect(reagent.totalQuantity).toBe(7);
    expect(movements).toHaveLength(1);
    expect(movements[0].quantityDelta).toBe(-3);
    expect(events).toHaveLength(1);
    expect(activities).toHaveLength(1);
  });

  it("replays the same request exactly once and rejects key reuse with different input", async () => {
    const batch = await createBatch({
      suffix: "replay",
      quantity: 10,
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/replay.pdf",
    });
    const payload = {
      clientRequestId: `${namespace}-replay-request`,
      reagentId,
      batchId: batch.id,
      quantity: 2,
      purpose: "lab",
    };

    const first = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload)
      .expect(201);
    const replay = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload)
      .expect(200);
    expect(replay.body.data.idempotentReplay).toBe(true);
    expect(replay.body.data.movementId).toBe(first.body.data.movementId);

    const conflict = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...payload, quantity: 3 })
      .expect(409);
    expect(conflict.body.code).toBe("IDEMPOTENCY_CONFLICT");

    const [storedBatch, movements, events, activities] = await Promise.all([
      prisma.reagentBatch.findUniqueOrThrow({ where: { id: batch.id } }),
      prisma.inventoryTransaction.count({
        where: { sourceType: "dispense_request", sourceId: payload.clientRequestId },
      }),
      prisma.dispenseEvent.count({ where: { batchId: batch.id } }),
      prisma.activityLog.count({
        where: { action: "stock_dispensed", entityId: batch.id },
      }),
    ]);
    expect([storedBatch.currentQuantity, movements, events, activities]).toEqual([
      8, 1, 1, 1,
    ]);
  });

  it("serializes concurrent stock-out so inventory cannot become negative", async () => {
    const batch = await createBatch({
      suffix: "concurrent",
      quantity: 10,
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/concurrent.pdf",
    });

    const call = (clientRequestId: string) =>
      request(app)
        .post("/api/dispense")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          clientRequestId,
          reagentId,
          batchId: batch.id,
          quantity: 6,
          purpose: "concurrency proof",
        });

    const responses = await Promise.all([
      call(`${namespace}-concurrent-a`),
      call(`${namespace}-concurrent-b`),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);

    const [storedBatch, movements, events] = await Promise.all([
      prisma.reagentBatch.findUniqueOrThrow({ where: { id: batch.id } }),
      prisma.inventoryTransaction.count({
        where: { reagentId, transactionType: "CONSUMPTION" },
      }),
      prisma.dispenseEvent.count({ where: { batchId: batch.id } }),
    ]);
    expect([storedBatch.currentQuantity, movements, events]).toEqual([4, 1, 1]);
  });

  it("coalesces concurrent retries with one request key and supports full stock-out", async () => {
    const batch = await createBatch({
      suffix: "same-key",
      quantity: 5,
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/same-key.pdf",
    });
    const payload = {
      clientRequestId: `${namespace}-same-key`,
      reagentId,
      batchId: batch.id,
      quantity: 5,
      purpose: "full laboratory use",
    };

    const responses = await Promise.all([
      request(app)
        .post("/api/dispense")
        .set("Authorization", `Bearer ${userToken}`)
        .send(payload),
      request(app)
        .post("/api/dispense")
        .set("Authorization", `Bearer ${userToken}`)
        .send(payload),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 201]);
    expect(
      responses.map((response) => response.body.data.idempotentReplay).sort(),
    ).toEqual([false, true]);

    const [storedBatch, movements, events, history] = await Promise.all([
      prisma.reagentBatch.findUniqueOrThrow({ where: { id: batch.id } }),
      prisma.inventoryTransaction.count({
        where: { sourceType: "dispense_request", sourceId: payload.clientRequestId },
      }),
      prisma.dispenseEvent.count({ where: { batchId: batch.id } }),
      request(app)
        .get(`/api/dispense/history?batchId=${batch.id}`)
        .set("Authorization", `Bearer ${readonlyToken}`),
    ]);
    expect(storedBatch.currentQuantity).toBe(0);
    expect(storedBatch.status).toBe("CONSUMED");
    expect([movements, events]).toEqual([1, 1]);
    expect(history.status).toBe(200);
    expect(history.body.data).toEqual([
      expect.objectContaining({
        batch: expect.objectContaining({ id: batch.id }),
        movementId: expect.any(String),
        quantity: 5,
      }),
    ]);
  });

  it("enforces roles, validates input, and retires bypass mutation routes", async () => {
    const batch = await createBatch({
      suffix: "security",
      qcStatus: "APPROVED",
      coaDocumentUrl: "/api/files/download/security.pdf",
    });

    await request(app)
      .post("/api/dispense")
      .send({
        clientRequestId: `${namespace}-unauthenticated`,
        reagentId,
        batchId: batch.id,
        quantity: 1,
        purpose: "lab",
      })
      .expect(401);

    await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${readonlyToken}`)
      .send({
        clientRequestId: `${namespace}-readonly`,
        reagentId,
        batchId: batch.id,
        quantity: 1,
        purpose: "lab",
      })
      .expect(403);

    await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        clientRequestId: `${namespace}-invalid-number`,
        reagentId,
        batchId: batch.id,
        quantity: "not-a-number",
        purpose: "lab",
      })
      .expect(400);

    const mismatch = await request(app)
      .post("/api/dispense")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        clientRequestId: `${namespace}-batch-reagent-mismatch`,
        reagentId: supplierId,
        batchId: batch.id,
        quantity: 1,
        purpose: "lab",
      })
      .expect(409);
    expect(mismatch.body.code).toBe("BATCH_UNAVAILABLE");

    await request(app)
      .post(`/api/batches/${batch.id}/withdraw`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 1 })
      .expect(410);

    await request(app)
      .post("/api/inventorytransactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reagent_id: reagentId,
        batch_id: batch.id,
        transaction_type: "CONSUMPTION",
        quantity: -1,
      })
      .expect(405);
  });
});
