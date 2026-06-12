-- Min/max stock policy per reagent: min = reorder point, max = fill-up-to target
ALTER TABLE "Reagent" ADD COLUMN IF NOT EXISTS "minStockLevel" DOUBLE PRECISION;
ALTER TABLE "Reagent" ADD COLUMN IF NOT EXISTS "maxStockLevel" DOUBLE PRECISION;
