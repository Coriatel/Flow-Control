import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app";
import { prisma } from "../utils/prisma";

describe("Flow Control demo replenishment order creation", () => {
  let authToken: string;
  let userId: string;
  let supplierId: string;
  let reagentId: string;
  let orderId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `demo-order-${Date.now()}@invalid.local`,
        name: "Demo Order Admin",
        password: await bcrypt.hash("isolated-test-only", 4),
        role: "ADMIN",
      },
    });
    userId = user.id;
    authToken = globalThis.testHelpers.generateToken(user.id, "ADMIN");

    const supplier = await prisma.supplier.create({
      data: {
        name: `Demo Order Supplier ${Date.now()}`,
        leadTimeDays: 7,
        isActive: true,
      },
    });
    supplierId = supplier.id;

    const reagent = await prisma.reagent.create({
      data: {
        name: `Demo Order Reagent ${Date.now()}`,
        catalogNumber: "DEMO-ORDER-001",
        supplierId,
        totalQuantity: 4,
        currentStockStatus: "CRITICAL",
        minStockLevel: 10,
        maxStockLevel: 24,
      },
    });
    reagentId = reagent.id;
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany({ where: { userId } });
    if (orderId) {
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    await prisma.reagent.deleteMany({ where: { id: reagentId } });
    await prisma.supplier.deleteMany({ where: { id: supplierId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("persists an immediate open order, expected supply dates, item, and activity atomically", async () => {
    const response = await request(app)
      .post("/api/functions/createAutomaticOrder")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        supplier: { id: supplierId },
        orderType: "immediate_delivery",
        items: [
          {
            reagent_id: reagentId,
            reagent_name: "Demo Order Reagent",
            catalog_number: "DEMO-ORDER-001",
            quantity: 20,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.success).toBe(true);
    orderId = response.body.data.orderId;

    const [order, activities] = await Promise.all([
      prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
      }),
      prisma.activityLog.findMany({
        where: { userId, action: "order_created", entityType: "order" },
      }),
    ]);

    expect(order.status).toBe("DRAFT");
    expect(order.orderType).toBe("IMMEDIATE");
    expect(order.expectedDeliveryStart).not.toBeNull();
    expect(order.expectedDeliveryEnd).not.toBeNull();
    expect(order.expectedDeliveryEnd!.getTime()).toBeGreaterThan(
      order.expectedDeliveryStart!.getTime(),
    );
    expect(order.items).toHaveLength(1);
    expect(order.items[0].requestedQuantity).toBe(20);
    expect(activities).toHaveLength(1);
    expect(activities[0].entityId).toBe(orderId);
  });
});
