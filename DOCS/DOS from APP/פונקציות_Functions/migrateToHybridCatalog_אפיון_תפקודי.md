# אפיון תפקודי - מעבר למודל קטלוג היברידי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/migrateToHybridCatalog.js

---

## מטרת הפונקציה

מיגרציה למודל קטלוג היברידי: ReagentCatalog (מקומי) + GlobalCatalog (משותף).

## Old Model
- Reagent בלבד

## New Model
- GlobalCatalog (shared)
- ReagentCatalog (per lab)
- Reagent (instances)

## תהליך

1. יצירת ReagentCatalog מכל Reagent
2. קישור catalog_item_id
3. שמירת נתונים קיימים