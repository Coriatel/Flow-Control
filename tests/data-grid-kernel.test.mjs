import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGridPipeline,
  createDefaultGridState,
  cycleSort,
  getExportRows,
  moveColumn,
  normalizeGridPreferences,
  resizeColumn,
} from "../src/lib/data-grid/gridState.js";

const columns = [
  { id: "name", accessorKey: "name", defaultWidth: 160, searchable: true },
  { id: "status", accessorKey: "status", defaultWidth: 120, searchable: true },
  { id: "quantity", accessorKey: "quantity", defaultWidth: 100, type: "number" },
  { id: "actions", defaultWidth: 88, enableSorting: false, alwaysVisible: true },
];

const rows = [
  { id: "b", name: "Beta", status: "RELEASED", quantity: 8 },
  { id: "a", name: "Alpha", status: "PENDING", quantity: 4 },
  { id: "c", name: "Gamma", status: "ON_HOLD", quantity: 12 },
];

test("sort cycles unsorted -> ascending -> descending -> unsorted", () => {
  assert.deepEqual(cycleSort(null, "name"), { id: "name", direction: "asc" });
  assert.deepEqual(cycleSort({ id: "name", direction: "asc" }, "name"), {
    id: "name",
    direction: "desc",
  });
  assert.equal(cycleSort({ id: "name", direction: "desc" }, "name"), null);
});

test("pipeline combines global search, column filters, sorting, and pagination", () => {
  const state = {
    ...createDefaultGridState(columns, { pageSize: 1 }),
    globalSearch: "a",
    columnFilters: { status: "released" },
    sort: { id: "quantity", direction: "desc" },
  };

  const result = applyGridPipeline(rows, columns, state);
  assert.equal(result.filteredCount, 1);
  assert.deepEqual(result.pageRows.map((row) => row.id), ["b"]);
  assert.equal(result.pageCount, 1);
});

test("column order, resize, and mandatory visibility are safely normalized", () => {
  const defaults = createDefaultGridState(columns);
  const moved = moveColumn(defaults.columnOrder, "quantity", "name");
  assert.deepEqual(moved, ["quantity", "name", "status", "actions"]);
  assert.equal(resizeColumn(120, -500), 72);

  const normalized = normalizeGridPreferences(
    {
      version: 1,
      columnOrder: ["missing", "status", "name"],
      columnVisibility: { actions: false, status: false, missing: true },
      columnWidths: { name: 9999, missing: 100 },
      pinnedColumns: { right: ["missing", "name"], left: ["actions"] },
      pageSize: 9999,
    },
    columns,
    { version: 1, pageSizes: [10, 25, 50] },
  );

  assert.deepEqual(normalized.columnOrder, ["status", "name", "quantity", "actions"]);
  assert.equal(normalized.columnVisibility.actions, true);
  assert.equal(normalized.columnVisibility.status, false);
  assert.equal(normalized.columnWidths.name, 640);
  assert.deepEqual(normalized.pinnedColumns, { right: ["name"], left: ["actions"] });
  assert.equal(normalized.pageSize, 25);
});

test("saved column widths remain stable across repeated normalization", () => {
  const columns = [{ id: "name", defaultWidth: 140 }];
  const saved = {
    ...createDefaultGridState(columns, { version: 1 }),
    version: 1,
    columnWidths: { name: 160 },
  };
  const once = normalizeGridPreferences(saved, columns, { version: 1 });
  const twice = normalizeGridPreferences(
    { ...once, version: 1 },
    columns,
    { version: 1 },
  );
  assert.equal(once.columnWidths.name, 160);
  assert.equal(twice.columnWidths.name, 160);
});

test("export rows preserve filtered and sorted order but ignore pagination", () => {
  const state = {
    ...createDefaultGridState(columns, { pageSize: 1 }),
    globalSearch: "a",
    sort: { id: "name", direction: "asc" },
  };
  const exported = getExportRows(rows, columns, state);
  assert.deepEqual(exported.map((row) => row.id), ["a", "b", "c"]);
});

test("authoritative eligibility fields remain data, never inferred by the grid", () => {
  const qaRows = [
    {
      id: "held",
      name: "Held batch",
      quantity: 10,
      qaStatus: "ON_HOLD",
      canDispense: false,
      blockedReasons: ["QA_ON_HOLD"],
    },
  ];
  const result = applyGridPipeline(
    qaRows,
    [...columns, { id: "qaStatus", accessorKey: "qaStatus" }],
    createDefaultGridState(
      [...columns, { id: "qaStatus", accessorKey: "qaStatus" }],
      {},
    ),
  );
  assert.equal(result.pageRows[0].canDispense, false);
  assert.deepEqual(result.pageRows[0].blockedReasons, ["QA_ON_HOLD"]);
});
