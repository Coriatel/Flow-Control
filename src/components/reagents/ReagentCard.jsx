import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatQuantity } from '@/components/utils/formatters';

const categoryLabels = {
  reagents: 'ריאגנטים',
  cells: 'כדוריות',
  controls: 'בקרות',
  solutions: 'תמיסות',
  consumables: 'מתכלים'
};

const stockStatusLabels = {
  in_stock: 'במלאי',
  low_stock: 'מלאי נמוך',
  out_of_stock: 'אזל מהמלאי',
  overstocked: 'מלאי עודף'
};

const stockStatusColors = {
  in_stock: 'bg-green-100 text-green-800 border-green-300',
  low_stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  overstocked: 'bg-blue-100 text-blue-800 border-blue-300'
};

export default function ReagentCard({ reagent }) {
  const formatExpiryDate = (dateString) => {
    if (!dateString) return null;
    const expiryDate = new Date(dateString);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
    
    return {
      formatted: expiryDate.toLocaleDateString('he-IL'),
      isExpired,
      isExpiringSoon
    };
  };

  const expiryInfo = reagent.nearest_expiry_date ? formatExpiryDate(reagent.nearest_expiry_date) : null;

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header Row - Name + Validation Status */}
        <div className="flex justify-between items-start mb-3">
          <Link
            to={createPageUrl(`EditReagent?id=${reagent.id}`)}
            className="text-base font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
          >
            {reagent.name}
            {reagent.hasValidationIssues && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </Link>
          
          <Badge variant="outline" className={stockStatusColors[reagent.current_stock_status] || 'bg-gray-100 text-gray-800'}>
            {stockStatusLabels[reagent.current_stock_status] || reagent.current_stock_status}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="space-y-2 text-sm">
          {/* Catalog Number + Supplier */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">מק"ט:</span>
              <span className="mr-1 font-medium">
                {reagent.catalog_number || <span className="text-amber-500">חסר</span>}
              </span>
            </div>
            <div>
              <span className="text-gray-500">ספק:</span>
              <span className="mr-1 font-medium">{reagent.supplier || <span className="text-amber-500">לא צוין</span>}</span>
            </div>
          </div>

          {/* Category + Quantity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">קטגוריה:</span>
              <span className="mr-1">{categoryLabels[reagent.category] || reagent.category}</span>
            </div>
            <div>
              <span className="text-gray-500">כמות:</span>
              <span className={`mr-1 font-semibold ${reagent.total_quantity_all_batches === 0 ? 'text-red-600' : ''}`}>
                {formatQuantity(reagent.total_quantity_all_batches || 0)}
              </span>
            </div>
          </div>

          {/* Batches + Expiry */}
          {reagent.requires_batches && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">אצוות:</span>
                <span className="mr-1">{reagent.active_batches_count || 0}</span>
              </div>
              {expiryInfo && (
                <div>
                  <span className="text-gray-500">תפוגה:</span>
                  <span className={`mr-1 ${expiryInfo.isExpired ? 'text-red-600 font-semibold' : expiryInfo.isExpiringSoon ? 'text-amber-600 font-medium' : ''}`}>
                    {expiryInfo.formatted}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Requirements Indicators */}
          <div className="flex gap-3 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs">
              {reagent.requires_batches ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-gray-600">אצווה</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {reagent.requires_expiry_date ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-gray-600">תפוגה</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {reagent.requires_coa ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-gray-600">COA</span>
            </div>
          </div>

          {/* Validation Status */}
          {reagent.hasValidationIssues && (
            <div className="pt-2 border-t">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                חסרים {reagent.missingFields?.length || 0} שדות
              </Badge>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-3 border-t flex justify-end">
          <Link to={createPageUrl(`EditReagent?id=${reagent.id}`)}>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 ml-2" />
              צפייה ועריכה
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}