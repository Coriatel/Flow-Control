import prisma from "../src/utils/prisma";
import { updateReagentAggregates } from "../src/services/reagentAggregates";

const NS = "FLOW_ROUND_B_20260720";
const IDS = {
  supplier: "croundb20260720supplier01",
  reagent: "croundb20260720reagent001",
  batch: "croundb20260720batch00001",
};

const futureDate = () => {
  const value = new Date();
  value.setUTCFullYear(value.getUTCFullYear() + 1);
  value.setUTCHours(0, 0, 0, 0);
  return value;
};

const cleanup = async (tx: any) => {
  await tx.activityLog.deleteMany({ where: { details: { contains: NS } } });
  await tx.inventoryTransaction.deleteMany({
    where: {
      OR: [
        { reagentId: IDS.reagent },
        { sourceId: { startsWith: NS } },
      ],
    },
  });
  await tx.dispenseEvent.deleteMany({ where: { reagentId: IDS.reagent } });
  await tx.reagentBatch.deleteMany({ where: { reagentId: IDS.reagent } });
  await tx.orderItem.deleteMany({ where: { reagentId: IDS.reagent } });
  await tx.reagent.deleteMany({ where: { id: IDS.reagent } });
  await tx.supplier.deleteMany({ where: { id: IDS.supplier } });
};

const findCollisions = async () => {
  const [suppliers, reagents, batches] = await Promise.all([
    prisma.supplier.findMany({
      where: {
        OR: [{ id: IDS.supplier }, { name: `${NS}_SUPPLIER` }],
      },
    }),
    prisma.reagent.findMany({
      where: {
        OR: [{ id: IDS.reagent }, { name: `${NS}_REAGENT` }],
      },
    }),
    prisma.reagentBatch.findMany({
      where: {
        OR: [{ id: IDS.batch }, { batchNumber: `${NS}_LOT_001` }],
      },
    }),
  ]);
  return { suppliers, reagents, batches };
};

const collision = async () => {
  const found = await findCollisions();
  const collisions =
    found.suppliers.length + found.reagents.length + found.batches.length;
  console.log(JSON.stringify({ namespace: NS, collisions }));
  if (collisions > 0) process.exitCode = 2;
};

const assertNamespaceOwnership = async () => {
  const found = await findCollisions();
  const safe =
    found.suppliers.every(
      (record: any) =>
        record.id === IDS.supplier && record.name === `${NS}_SUPPLIER`,
    ) &&
    found.reagents.every(
      (record: any) =>
        record.id === IDS.reagent && record.name === `${NS}_REAGENT`,
    ) &&
    found.batches.every(
      (record: any) =>
        record.id === IDS.batch && record.batchNumber === `${NS}_LOT_001`,
    );
  if (!safe) {
    throw new Error(`${NS} collision is not owned by the reversible fixture`);
  }
  return found;
};

const reset = async () => {
  await assertNamespaceOwnership();
  await prisma.$transaction(async (tx) => {
    await cleanup(tx);
    await tx.supplier.create({
      data: {
        id: IDS.supplier,
        name: `${NS}_SUPPLIER`,
        shortCode: "RBQA",
        isPreferred: true,
      },
    });
    await tx.reagent.create({
      data: {
        id: IDS.reagent,
        name: `${NS}_REAGENT`,
        catalogNumber: "RB-QA-20260720",
        supplierId: IDS.supplier,
        totalQuantity: 0,
        minStockLevel: 9,
        maxStockLevel: 12,
        currentStockStatus: "OUT_OF_STOCK",
      },
    });
    await tx.reagentBatch.create({
      data: {
        id: IDS.batch,
        reagentId: IDS.reagent,
        batchNumber: `${NS}_LOT_001`,
        initialQuantity: 10,
        currentQuantity: 10,
        receivedDate: new Date(),
        expiryDate: futureDate(),
        status: "ACTIVE",
        qcStatus: "PENDING",
        storageLocation: "Round B isolated QA refrigerator",
        generalNotes: `${NS} reversible functional fixture`,
      },
    });
    await updateReagentAggregates(IDS.reagent, tx);
  });
  await verify();
};

const apply = async () => {
  const found = await assertNamespaceOwnership();
  const collisions =
    found.suppliers.length + found.reagents.length + found.batches.length;
  if (collisions > 0) {
    throw new Error(`${NS} already exists; use reset only for the known fixture`);
  }
  await reset();
};

const verify = async () => {
  const [reagent, batch, movements, events, audits] = await Promise.all([
    prisma.reagent.findUnique({ where: { id: IDS.reagent } }),
    prisma.reagentBatch.findUnique({ where: { id: IDS.batch } }),
    prisma.inventoryTransaction.count({ where: { reagentId: IDS.reagent } }),
    prisma.dispenseEvent.count({ where: { reagentId: IDS.reagent } }),
    prisma.activityLog.count({ where: { details: { contains: NS } } }),
  ]);
  const valid =
    reagent?.totalQuantity === 10 &&
    batch?.currentQuantity === 10 &&
    batch?.status === "ACTIVE" &&
    batch?.qcStatus === "PENDING" &&
    batch?.coaDocumentUrl === null &&
    movements === 0 &&
    events === 0 &&
    audits === 0;
  console.log(
    JSON.stringify({
      namespace: NS,
      valid,
      reagentId: IDS.reagent,
      batchId: IDS.batch,
      physicalQuantity: reagent?.totalQuantity ?? null,
      batchQuantity: batch?.currentQuantity ?? null,
      qcStatus: batch?.qcStatus ?? null,
      movements,
      events,
      audits,
    }),
  );
  if (!valid) process.exitCode = 1;
};

const remove = async () => {
  await prisma.$transaction(cleanup);
  const remaining = await prisma.reagent.count({ where: { id: IDS.reagent } });
  console.log(JSON.stringify({ namespace: NS, cleaned: remaining === 0 }));
  if (remaining !== 0) process.exitCode = 1;
};

const command = process.argv[2];
const run = async () => {
  if (command === "collision") return collision();
  if (command === "apply") return apply();
  if (command === "reset") return reset();
  if (command === "verify") return verify();
  if (command === "cleanup") return remove();
  throw new Error("Usage: round-b-fixture.ts collision|apply|reset|verify|cleanup");
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Round B fixture failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
