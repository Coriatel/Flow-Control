import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BatchEntry from "./BatchEntry";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Package } from "lucide-react";

export default function ReagentItem({ reagent, batches, onBatchesChange, showNewBadge }) {
  const handleAddBatch = () => {
    const newBatch = {
      id: null,
      batch_number: '',
      expiry_date: '',
      quantity: 0,
      isExistingBatch: false
    };
    onBatchesChange([...batches, newBatch]);
  };

  const handleBatchChange = (index, updatedBatch) => {
    const newBatches = [...batches];
    newBatches[index] = updatedBatch;
    onBatchesChange(newBatches);
  };

  const handleRemoveBatch = (index) => {
    const newBatches = batches.filter((_, i) => i !== index);
    onBatchesChange(newBatches);
  };

  // Count new batches
  const newBatchesCount = batches.filter(b => b.isNewFromDelivery).length;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                {reagent.name}
              </h3>
              
              {/* New Batches Badge */}
              {newBatchesCount > 0 && (
                <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  {newBatchesCount} חדשות
                </Badge>
              )}
              
              {/* Total Batches Badge */}
              {batches.length > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {batches.length} אצוות
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-gray-600">
              {reagent.catalog_number && (
                <span>מק"ט: {reagent.catalog_number}</span>
              )}
              {reagent.supplier && (
                <span>ספק: {reagent.supplier}</span>
              )}
            </div>
            
            {/* Last Count Info */}
            {reagent.lastCountDate && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                ספירה אחרונה: {new Date(reagent.lastCountDate).toLocaleDateString('he-IL')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {batches.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">אין אצוות - לחץ להוספה</p>
          </div>
        ) : (
          batches.map((batch, index) => (
            <BatchEntry
              key={index}
              batch={batch}
              onChange={(updated) => handleBatchChange(index, updated)}
              onRemove={() => handleRemoveBatch(index)}
              isNewFromDelivery={batch.isNewFromDelivery}
              lastCountedQuantity={batch.lastCountedQuantity}
            />
          ))
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddBatch}
          className="w-full border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-4 w-4 ml-2" />
          הוסף אצווה
        </Button>
      </div>
    </Card>
  );
}