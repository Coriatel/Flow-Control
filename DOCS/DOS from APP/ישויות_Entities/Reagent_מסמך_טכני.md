# מסמך טכני - ריאגנט - ישות ראשית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Reagent.json

---

# מסמך טכני - Reagent Entity

## Schema (entities/Reagent.json)

```json
{
  "name": "Reagent",
  "type": "object",
  "properties": {
    "catalog_item_id": { "type": "string" },
    "name": { "type": "string" },
    "category": {
      "type": "string",
      "enum": ["reagents", "cells", "controls", "solutions", "consumables"]
    },
    "current_supplier_id": { "type": "string" },
    "supplier": { "type": "string" },
    "historical_suppliers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "supplier_id": { "type": "string" },
          "supplier_name": { "type": "string" },
          "from_date": { "type": "string", "format": "date" },
          "to_date": { "type": "string", "format": "date" }
        }
      }
    },
    "catalog_number": { "type": "string" },
    "total_quantity_all_batches": { "type": "number", "default": 0 },
    "active_batches_count": { "type": "integer", "default": 0 },
    "nearest_expiry_date": { "type": "string", "format": "date" },
    "average_monthly_usage": { "type": "number", "default": 0 },
    "manual_monthly_usage": { "type": "number" },
    "use_manual_usage": { "type": "boolean", "default": false },
    "months_of_stock": { "type": "number" },
    "current_stock_status": {
      "type": "string",
      "enum": ["in_stock", "low_stock", "out_of_stock", "overstocked"],
      "default": "out_of_stock"
    },
    "is_critical": { "type": "boolean", "default": false },
    "alternative_reagents": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["catalog_item_id", "name", "category", "current_supplier_id", "catalog_number"]
}
```

## Relationships

### One-to-Many:
- **Reagent** ← **ReagentBatch** (reagent_id)
- **Reagent** ← **InventoryTransaction** (reagent_id)
- **Reagent** ← **OrderItem** (reagent_id)
- **Reagent** ← **DeliveryItem** (reagent_id)

### Many-to-One:
- **Reagent** → **ReagentCatalog** (catalog_item_id)
- **Reagent** → **Supplier** (current_supplier_id)

## Update Triggers

### 1. After Delivery Receipt:
```javascript
// In processDelivery function:
await base44.functions.invoke('runSummaryUpdates', { reagent_id });
```

### 2. After Inventory Count:
```javascript
// In processCompletedCount:
await updateReagentTotals(reagent_id);
```

### 3. Scheduled (Daily):
```javascript
// Cron job:
await runSummaryUpdates(); // all reagents
```

## Calculation Logic (runSummaryUpdates)

```javascript
const batches = await ReagentBatch.filter({ 
  reagent_id, 
  status: 'active' 
});

const total = batches.reduce((sum, b) => sum + b.current_quantity, 0);
const nearest = batches
  .map(b => parseISO(b.expiry_date))
  .sort((a, b) => a - b)[0];

const usage = reagent.use_manual_usage 
  ? reagent.manual_monthly_usage 
  : await calculateAverageUsage(reagent_id);

const monthsOfStock = usage > 0 ? total / usage : Infinity;
const status = 
  total === 0 ? 'out_of_stock' :
  monthsOfStock < 2 ? 'low_stock' : 'in_stock';

await Reagent.update(reagent_id, {
  total_quantity_all_batches: total,
  active_batches_count: batches.length,
  nearest_expiry_date: nearest,
  months_of_stock: monthsOfStock,
  current_stock_status: status
});
```