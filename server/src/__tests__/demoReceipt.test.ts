import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app";
import { prisma } from "../utils/prisma";

describe("Flow Control demo order receipt", () => {
  let authToken: string;
  let userId: string;
  let supplierId: string;
  let reagentId: string;
  let orderId: string;
  let orderItemId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `demo-receipt-${Date.now()}@invalid.local`,
        name: "Demo Receipt Admin",
        password: await bcrypt.hash("isolated-test-only", 4),
        role: "ADMIN",
      },
    });
    userId = user.id;
    authToken = globalThis.testHelpers.generateToken(user.id, "ADMIN");

    const supplier = await prisma.supplier.create({
      data: {
        name: `Demo Receipt Supplier ${Date.now()}`,
        isActive: true,
      },
    });
    supplierId = supplier.id;

    const reagent = await prisma.reagent.create({
      data: {
        name: `Anti-D Demo ${Date.now()}`,
        catalogNumber: "DEMO-ANTI-D-10",
        category: "REAGENT",
        supplierId,
        totalQuantity: 4,
        activeBatchesCount: 1,
        nearestExpiryDate: new Date("2027-07-19T00:00:00.000Z"),
        currentStockStatus: "CRITICAL",
        monthsOfStock: 0.7,
        manualMonthlyUsage: 6,
        useManualUsage: true,
        minStockLevel: 10,
        maxStockLevel: 24,
      },
    });
    reagentId = reagent.id;

    await prisma.reagentBatch.create({
      data: {
        reagentId,
        batchNumber: "BASE-260701",
        expiryDate: new Date("2027-07-19T00:00:00.000Z"),
        initialQuantity: 4,
        currentQuantity: 4,
        receivedDate: new Date("2026-07-01T00:00:00.000Z"),
        status: "ACTIVE",
        qcStatus: "APPROVED",
      },
    });

    const order = await prisma.order.create({
      data: {
        tempNumber: `ORD-DEMO-${Date.now()}`,
        supplierId,
        supplierSnapshot: supplier.name,
        orderType: "IMMEDIATE",
        status: "APPROVED",
        expectedDeliveryStart: new Date("2026-07-20T00:00:00.000Z"),
        expectedDeliveryEnd: new Date("2026-07-26T00:00:00.000Z"),
      },
    });
    orderId = order.id;

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        reagentId,
        requestedQuantity: 20,
        receivedQuantity: 0,
        remainingQuantity: 20,
      },
    });
    orderItemId = item.id;
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany({ where: { userId } });
    await prisma.inventoryTransaction.deleteMany({ where: { reagentId } });
    await prisma.reagentBatch.deleteMany({ where: { reagentId } });
    await prisma.deliveryItem.deleteMany({ where: { reagentId } });
    await prisma.delivery.deleteMany({ where: { supplierId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.reagent.deleteMany({ where: { id: reagentId } });
    await prisma.supplier.deleteMany({ where: { id: supplierId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  const receive = (deliveryReference: string, quantity: number, batch: string) =>
    request(app)
      .post(`/api/orders/${orderId}/receive`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        deliveryReference,
        deliveryDate: "2026-07-19",
        items: [
          {
            orderItemId,
            receivedQuantity: quantity,
            batchNumber: batch,
            expiryDate: "2027-07-19",
            storageLocation: "Refrigerator R2 / Shelf A",
          },
        ],
      });

  it("receives partially, replays exactly once, then receives fully", async () => {
    const partial = await receive("DEMO-DN-20260719-001", 8, "LOT-AD-001");
    expect(partial.status).toBe(200);
    expect(partial.body.success).toBe(true);
    expect(partial.body.data.idempotentReplay).toBe(false);
    expect(partial.body.data.order.status).toBe("PARTIALLY_RECEIVED");
    expect(partial.body.data.order.remainingQuantity).toBe(12);
    expect(partial.body.data.delivery.status).toBe("COMPLETED");

    const afterPartial = await Promise.all([
      prisma.inventoryTransaction.count({
        where: { reagentId, transactionType: "RECEIPT" },
      }),
      prisma.reagentBatch.count({ where: { reagentId } }),
      prisma.delivery.count({ where: { orderId } }),
      prisma.activityLog.count({
        where: {
          userId,
          action: "delivery_received",
          entityType: "delivery",
        },
      }),
    ]);
    expect(afterPartial).toEqual([1, 2, 1, 1]);

    const replay = await receive("DEMO-DN-20260719-001", 8, "LOT-AD-001");
    expect(replay.status).toBe(200);
    expect(replay.body.data.idempotentReplay).toBe(true);

    const afterReplay = await Promise.all([
      prisma.inventoryTransaction.count({
        where: { reagentId, transactionType: "RECEIPT" },
      }),
      prisma.reagentBatch.count({ where: { reagentId } }),
      prisma.delivery.count({ where: { orderId } }),
      prisma.activityLog.count({
        where: {
          userId,
          action: "delivery_received",
          entityType: "delivery",
        },
      }),
    ]);
    expect(afterReplay).toEqual(afterPartial);

    const full = await receive("DEMO-DN-20260719-002", 12, "LOT-AD-002");
    expect(full.status).toBe(200);
    expect(full.body.data.order.status).toBe("FULLY_RECEIVED");
    expect(full.body.data.order.remainingQuantity).toBe(0);

    const [reagent, orderItem, movements, deliveries, suggestions] =
      await Promise.all([
        prisma.reagent.findUniqueOrThrow({ where: { id: reagentId } }),
        prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId } }),
        prisma.inventoryTransaction.findMany({
          where: { reagentId, transactionType: "RECEIPT" },
        }),
        prisma.delivery.findMany({ where: { orderId } }),
        request(app)
          .post("/api/functions/getReplenishmentData")
          .set("Authorization", `Bearer ${authToken}`)
          .send({}),
      ]);

    expect(reagent.totalQuantity).toBe(24);
    expect(reagent.currentStockStatus).toBe("NORMAL");
    expect(orderItem.receivedQuantity).toBe(20);
    expect(orderItem.remainingQuantity).toBe(0);
    expect(movements).toHaveLength(2);
    expect(deliveries).toHaveLength(2);

    const replenishmentPayload =
      suggestions.body?.data?.data ?? suggestions.body?.data ?? {};
    const remainingSuggestion = (
      replenishmentPayload.reagentsData || []
    ).find((item: any) => item.id === reagentId);
    expect(remainingSuggestion?.suggested_order_quantity || 0).toBe(0);
  });
});
