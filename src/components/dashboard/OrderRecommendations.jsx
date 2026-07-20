import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ClipboardList, PackageCheck, ShoppingCart, TrendingDown } from "lucide-react";

function calcSuggestedQuantity(item) {
  const current = Number(item.currentQuantity || 0);
  const min = Number(item.minStockLevel || 0);
  const max = Number(item.maxStockLevel || 0);
  if (min > 0) {
    // מדיניות מינ'/מקס': מתחת למינימום — השלמה עד המקסימום
    if (current >= min) return 0;
    const target = max > min ? max : min;
    return Math.max(1, Math.ceil(target - current));
  }
  const monthly = Number(item.averageUsage || 0);
  const target = Math.max(monthly * 2, current <= 0 ? 2 : 1);
  return Math.max(1, Math.ceil(target - current));
}

function formatMonths(months) {
  const value = Number(months || 0);
  if (value <= 0) return "אזל";
  if (value < 1) return `${Math.max(1, Math.round(value * 4.33))} שבועות`;
  return `${value.toFixed(1)} חודשים`;
}

export default function OrderRecommendations({ lowStockReagents = [], onOrderQuantity = 0 }) {
  const recommendations = lowStockReagents
    .map((item) => ({
      ...item,
      suggestedQuantity: calcSuggestedQuantity(item),
    }))
    .filter((item) => item.suggestedQuantity > 0)
    .sort((a, b) => Number(a.monthsOfStock || 0) - Number(b.monthsOfStock || 0))
    .slice(0, 5);

  return (
    <Card className="flow-demo-panel bg-white border border-teal-100 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flow-demo-panel__header py-4 px-4 border-b border-teal-100">
        <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-slate-900">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-xl">
              <ShoppingCart className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold">המלצות דרישה וצריכת מלאי</h3>
              <p className="text-xs font-normal text-slate-500 mt-0.5">
                חישוב לפי כמות נוכחית, צריכה חודשית וחודשי מלאי זמינים
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-2">
            <Badge variant="outline" className="justify-center bg-white border-teal-200 text-teal-800">
              {recommendations.length} המלצות
            </Badge>
            <Badge variant="outline" className="justify-center bg-blue-50 border-blue-200 text-blue-800">
              בדרך: {Number(onOrderQuantity || 0).toLocaleString("he-IL")} יח׳
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recommendations.length === 0 ? (
          <div className="p-5 text-center text-sm text-slate-500">
            אין כרגע המלצות דרישה — המלאי נראה מאוזן.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recommendations.map((item) => {
              const critical = Number(item.monthsOfStock || 0) < 1;
              return (
                <div
                  key={item.id}
                  className={`flow-reco-row ${critical ? "flow-reco-row--critical" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 justify-end">
                      {critical && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
                          קריטי
                        </Badge>
                      )}
                      <Link
                        to={createPageUrl(`InventoryReplenishment?reagent_id=${item.id}`)}
                        className="font-bold text-slate-900 hover:text-teal-700 hover:underline truncate"
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </div>
                    <div className="flow-reco-row__meta">
                      <span>{item.supplier || "ספק לא צוין"}</span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        צריכה חודשית: {Number(item.averageUsage || 0).toLocaleString("he-IL")}
                      </span>
                      <span>מלאי: {formatMonths(item.monthsOfStock)}</span>
                      {Number(item.minStockLevel || 0) > 0 && (
                        <span>
                          מינ׳: {Number(item.minStockLevel).toLocaleString("he-IL")}
                          {Number(item.maxStockLevel || 0) > 0 &&
                            ` · מקס׳: ${Number(item.maxStockLevel).toLocaleString("he-IL")}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flow-reco-row__action">
                    <div className="text-xs text-slate-500">כמות מומלצת</div>
                    <div className="text-xl font-extrabold text-teal-800">
                      {item.suggestedQuantity.toLocaleString("he-IL")} יח׳
                    </div>
                    <Button asChild size="sm" variant="outline" className="mt-2 h-8 border-teal-200 text-teal-800 hover:bg-teal-50">
                      <Link to={createPageUrl(`NewOrder?reagent_id=${item.id}`)}>
                        <ClipboardList className="h-3.5 w-3.5 ms-1" />
                        פתח דרישה
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flow-demo-panel__footer">
          <PackageCheck className="h-4 w-4 text-teal-700" />
          <span>פריט עם מינימום/מקסימום מוגדרים — השלמה עד המקסימום; אחרת יעד של כשני חודשי מלאי.</span>
        </div>
      </CardContent>
    </Card>
  );
}
