import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const IDS = {
  user: "cflowdemoadmin20260719",
  supplier: "cflowdemosupplier20260719",
  shortageReagent: "cflowdemoreagentshortage1",
  controlReagent: "cflowdemoreagentcontrol01",
  nearExpiryReagent: "cflowdemoreagentexpiry001",
  shortageBatch: "cflowdemobatchshortage01",
  controlBatch: "cflowdemobatchcontrol001",
  nearExpiryBatch: "cflowdemobatchexpiry0001",
} as const;

const DEMO_EMAIL = "demo-readiness-admin@invalid.local";

async function reset() {
  await prisma.$transaction(async (tx) => {
    await tx.activityLog.deleteMany({
      where: {
        OR: [
          { userId: IDS.user },
          {
            entityId: {
              in: [
                IDS.shortageReagent,
                IDS.controlReagent,
                IDS.nearExpiryReagent,
              ],
            },
          },
        ],
      },
    });
    await tx.inventoryTransaction.deleteMany({
      where: {
        reagentId: {
          in: [
            IDS.shortageReagent,
            IDS.controlReagent,
            IDS.nearExpiryReagent,
          ],
        },
      },
    });
    await tx.deliveryItem.deleteMany({
      where: {
        reagentId: {
          in: [
            IDS.shortageReagent,
            IDS.controlReagent,
            IDS.nearExpiryReagent,
          ],
        },
      },
    });
    await tx.reagentBatch.deleteMany({
      where: {
        reagentId: {
          in: [
            IDS.shortageReagent,
            IDS.controlReagent,
            IDS.nearExpiryReagent,
          ],
        },
      },
    });
    await tx.orderItem.deleteMany({
      where: {
        reagentId: {
          in: [
            IDS.shortageReagent,
            IDS.controlReagent,
            IDS.nearExpiryReagent,
          ],
        },
      },
    });
    await tx.delivery.deleteMany({ where: { supplierId: IDS.supplier } });
    await tx.order.deleteMany({ where: { supplierId: IDS.supplier } });
    await tx.reagent.deleteMany({
      where: {
        id: {
          in: [
            IDS.shortageReagent,
            IDS.controlReagent,
            IDS.nearExpiryReagent,
          ],
        },
      },
    });
    await tx.supplier.deleteMany({ where: { id: IDS.supplier } });
    await tx.user.deleteMany({ where: { id: IDS.user } });
  });
}

async function apply() {
  const demoPassword = process.env.FLOW_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error("FLOW_DEMO_PASSWORD is required to apply the demo fixture");
  }
  if (demoPassword.length < 16) {
    throw new Error("FLOW_DEMO_PASSWORD must be at least 16 characters");
  }

  await reset();
  const password = await bcrypt.hash(demoPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: IDS.user,
        email: DEMO_EMAIL,
        name: "Flow Demo Administrator",
        password,
        role: "ADMIN",
      },
    });

    await tx.supplier.create({
      data: {
        id: IDS.supplier,
        name: "BioLab Diagnostics Demo",
        shortCode: "BLD-DEMO",
        email: "orders@biolab-demo.invalid",
        phone: "+972-3-555-0142",
        leadTimeDays: 7,
        isPreferred: true,
        isActive: true,
      },
    });

    await tx.reagent.createMany({
      data: [
        {
          id: IDS.shortageReagent,
          name: "Anti-D IgM Monoclonal Reagent",
          catalogNumber: "BLD-AD-IgM-10",
          category: "REAGENT",
          supplierId: IDS.supplier,
          totalQuantity: 4,
          activeBatchesCount: 1,
          nearestExpiryDate: new Date("2027-07-19T00:00:00.000Z"),
          currentStockStatus: "CRITICAL",
          monthsOfStock: 0.7,
          manualMonthlyUsage: 6,
          useManualUsage: true,
          minStockLevel: 10,
          maxStockLevel: 24,
          notes: "FLOW_DEMO_20260719 primary shortage",
        },
        {
          id: IDS.controlReagent,
          name: "Coombs Control Cells",
          catalogNumber: "BLD-CCC-5",
          category: "CELLS",
          supplierId: IDS.supplier,
          totalQuantity: 18,
          activeBatchesCount: 1,
          nearestExpiryDate: new Date("2027-01-31T00:00:00.000Z"),
          currentStockStatus: "NORMAL",
          monthsOfStock: 6,
          manualMonthlyUsage: 3,
          useManualUsage: true,
          minStockLevel: 6,
          maxStockLevel: 18,
          notes: "FLOW_DEMO_20260719 valid control stock",
        },
        {
          id: IDS.nearExpiryReagent,
          name: "ABO Reverse Grouping Cells A1",
          catalogNumber: "BLD-A1-CELL-10",
          category: "CELLS",
          supplierId: IDS.supplier,
          totalQuantity: 12,
          activeBatchesCount: 1,
          nearestExpiryDate: new Date("2026-08-05T00:00:00.000Z"),
          currentStockStatus: "NORMAL",
          monthsOfStock: 4,
          manualMonthlyUsage: 3,
          useManualUsage: true,
          minStockLevel: 5,
          maxStockLevel: 15,
          notes: "FLOW_DEMO_20260719 near-expiry example",
        },
      ],
    });

    await tx.reagentBatch.createMany({
      data: [
        {
          id: IDS.shortageBatch,
          reagentId: IDS.shortageReagent,
          batchNumber: "AD-260701",
          expiryDate: new Date("2027-07-19T00:00:00.000Z"),
          initialQuantity: 4,
          currentQuantity: 4,
          receivedDate: new Date("2026-07-01T00:00:00.000Z"),
          storageLocation: "Refrigerator R2 / Shelf A",
          storageConditions: "2-8°C",
          status: "ACTIVE",
          qcStatus: "APPROVED",
          generalNotes: "FLOW_DEMO_20260719 baseline",
        },
        {
          id: IDS.controlBatch,
          reagentId: IDS.controlReagent,
          batchNumber: "CCC-260615",
          expiryDate: new Date("2027-01-31T00:00:00.000Z"),
          initialQuantity: 18,
          currentQuantity: 18,
          receivedDate: new Date("2026-06-15T00:00:00.000Z"),
          storageLocation: "Refrigerator R2 / Shelf B",
          storageConditions: "2-8°C",
          status: "ACTIVE",
          qcStatus: "APPROVED",
          generalNotes: "FLOW_DEMO_20260719 baseline",
        },
        {
          id: IDS.nearExpiryBatch,
          reagentId: IDS.nearExpiryReagent,
          batchNumber: "A1-260401",
          expiryDate: new Date("2026-08-05T00:00:00.000Z"),
          initialQuantity: 12,
          currentQuantity: 12,
          receivedDate: new Date("2026-04-01T00:00:00.000Z"),
          storageLocation: "Refrigerator R1 / Shelf C",
          storageConditions: "2-8°C",
          status: "ACTIVE",
          qcStatus: "APPROVED",
          generalNotes: "FLOW_DEMO_20260719 near-expiry baseline",
        },
      ],
    });

    await tx.activityLog.create({
      data: {
        userId: IDS.user,
        action: "demo_baseline_reset",
        entityType: "reagent",
        entityId: IDS.shortageReagent,
        details: JSON.stringify({
          campaign: "FLOW_DEMO_20260719",
          initialQuantity: 4,
          minStockLevel: 10,
          maxStockLevel: 24,
          recommendedOrderQuantity: 20,
        }),
      },
    });
  });
}

async function verify() {
  const [reagent, batches, openItems, movements] = await Promise.all([
    prisma.reagent.findUnique({ where: { id: IDS.shortageReagent } }),
    prisma.reagentBatch.findMany({
      where: { reagentId: IDS.shortageReagent, status: "ACTIVE" },
    }),
    prisma.orderItem.findMany({
      where: {
        reagentId: IDS.shortageReagent,
        order: {
          status: {
            in: ["DRAFT", "PENDING_SAP", "APPROVED", "PARTIALLY_RECEIVED"],
          },
        },
      },
    }),
    prisma.inventoryTransaction.findMany({
      where: { reagentId: IDS.shortageReagent },
    }),
  ]);

  const batchQuantity = batches.reduce(
    (sum, batch) => sum + Number(batch.currentQuantity),
    0,
  );
  const expectedBaseline =
    reagent &&
    Number(reagent.totalQuantity) === 4 &&
    batchQuantity === 4 &&
    openItems.length === 0 &&
    movements.length === 0 &&
    reagent.currentStockStatus === "CRITICAL";

  const evidence = {
    campaign: "FLOW_DEMO_20260719",
    baselineValid: Boolean(expectedBaseline),
    reagent: reagent
      ? {
          id: reagent.id,
          name: reagent.name,
          catalogNumber: reagent.catalogNumber,
          totalQuantity: reagent.totalQuantity,
          minStockLevel: reagent.minStockLevel,
          maxStockLevel: reagent.maxStockLevel,
          currentStockStatus: reagent.currentStockStatus,
        }
      : null,
    activeBatchQuantity: batchQuantity,
    openOrderItems: openItems.length,
    inventoryMovements: movements.length,
    expectedRecommendation: 20,
    expectedAfterReceipt: 24,
  };

  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!expectedBaseline) process.exitCode = 1;
}

async function main() {
  const command = process.argv[2];
  if (command === "apply") await apply();
  else if (command === "reset") await reset();
  else if (command === "verify") await verify();
  else {
    throw new Error("Usage: demo-readiness-fixture.ts <apply|reset|verify>");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
