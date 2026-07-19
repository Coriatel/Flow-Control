export function isAdminRole(role) {
  return String(role || "").toUpperCase() === "ADMIN";
}

export function calculateMinMaxSuggestion({
  currentQuantity,
  incomingQuantity,
  minStockLevel,
  maxStockLevel,
}) {
  const current = Number(currentQuantity) || 0;
  const incoming = Number(incomingQuantity) || 0;
  const minimum = Number(minStockLevel) || 0;
  const maximum = Number(maxStockLevel) || 0;
  if (minimum <= 0) return null;

  const projected = current + incoming;
  if (projected >= minimum) return 0;
  const target = maximum > minimum ? maximum : minimum;
  return Math.max(0, Math.ceil(target - projected));
}

export function normalizeAnalyticsPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const requiredObjects = [
    "summary_stats",
    "efficiency_metrics",
    "predictions",
    "stock_distribution",
    "expiry_analysis",
  ];
  const requiredArrays = [
    "consumption_trend",
    "orders_trend",
    "top_reagents",
  ];

  if (
    requiredObjects.some(
      (key) =>
        !payload[key] ||
        typeof payload[key] !== "object" ||
        Array.isArray(payload[key]),
    ) ||
    requiredArrays.some((key) => !Array.isArray(payload[key]))
  ) {
    return null;
  }

  if (
    typeof payload.summary_stats.total_reagents !== "number" ||
    typeof payload.summary_stats.active_reagents !== "number"
  ) {
    return null;
  }

  return payload;
}
