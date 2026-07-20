import test from "node:test";
import assert from "node:assert/strict";
import {
  isAdminRole,
  normalizeAnalyticsPayload,
  calculateMinMaxSuggestion,
} from "../src/lib/demoReadiness.js";

test("ADMIN role matching is case-insensitive", () => {
  assert.equal(isAdminRole("ADMIN"), true);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("MANAGER"), false);
  assert.equal(isAdminRole(null), false);
});

test("incomplete analytics becomes an honest unavailable state", () => {
  assert.equal(
    normalizeAnalyticsPayload({
      message: "Function getAdvancedAnalytics not yet implemented",
      data: [],
    }),
    null,
  );
  assert.equal(normalizeAnalyticsPayload({ summary_stats: {} }), null);

  const valid = {
    summary_stats: { total_reagents: 3, active_reagents: 3 },
    efficiency_metrics: {
      order_completion_rate: 100,
      total_orders: 1,
      avg_order_processing_days: 1,
    },
    predictions: { next_month_consumption: 5 },
    consumption_trend: [],
    stock_distribution: {},
    orders_trend: [],
    top_reagents: [],
    expiry_analysis: {},
  };
  assert.deepEqual(normalizeAnalyticsPayload(valid), valid);
});

test("min/max replenishment uses projected stock and resolves incoming supply", () => {
  assert.equal(
    calculateMinMaxSuggestion({
      currentQuantity: 4,
      incomingQuantity: 0,
      minStockLevel: 10,
      maxStockLevel: 24,
    }),
    20,
  );
  assert.equal(
    calculateMinMaxSuggestion({
      currentQuantity: 4,
      incomingQuantity: 20,
      minStockLevel: 10,
      maxStockLevel: 24,
    }),
    0,
  );
});
