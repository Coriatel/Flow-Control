
import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, isValid } from 'date-fns';
import {
  Edit, Trash2, ChevronUp, ChevronDown, Wrench, Eye, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatQuantity } from '@/components/utils/formatters';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Sortable Header Component
const SortableHeader = ({ children, column, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === column;
  return (
    <div
      className="flex items-center justify-center gap-1 cursor-pointer select-none group"
      onClick={() => onSort(column)}
    >
      <span>{children}</span>
      <div className="flex flex-col">
        <ChevronUp className={`h-3 w-3 transition-colors ${isSorted && sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <ChevronDown className={`h-3 w-3 -mt-1 transition-colors ${isSorted && sortConfig.direction === 'desc' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
      </div>
    </div>
  );
};

export default function QATable({
  data,
  visibleColumns,
  sortField,
  sortDirection,
  onSort,
  onHandleItem, // NEW: Handler for the "Handle" action
  onCOAUpload,
  onCOAView,
  onEdit,
  onDelete
}) {
  const navigate = useNavigate();

  // State and logic for column resizing (RTL-fixed)
  const [columnWidths, setColumnWidths] = useState({});
  useEffect(() => {
    const initialWidths = {};
    visibleColumns.forEach(c => {
      initialWidths[c.accessor] = c.width || 120;
    });
    setColumnWidths(initialWidths);
  }, [visibleColumns]);

  const [isResizing, setIsResizing] = useState(null);

  const handleMouseDown = useCallback((column) => {
    setIsResizing(column);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  // Fixed RTL mouse movement for column resizing
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: Math.max(80, prev[isResizing] - e.movementX) // הפוך את הכיוון עבור RTL
    }));
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // NEW: Check if item can be handled
  const canBeHandled = (item) => {
    // Only allow handling if current_quantity > 0 and no action has been taken (assuming action_taken is a relevant flag)
    return item.current_quantity > 0 && !item.action_taken; 
  };

  const TableRow = ({ item }) => {
    const shouldShowHandleButton = canBeHandled(item);

    return (
      <tr className="hover:bg-slate-50 transition-colors">
        {visibleColumns.map(column => {
          if (column.accessor === 'actions') {
            return (
              <td key={column.accessor} className="px-2 py-2 lg:py-2.5 text-xs text-slate-700 align-middle border-l border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">
                <div className="flex items-center justify-center gap-1">
                  {/* COA Actions */}
                  {item.coa_documents && item.coa_documents.length > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCOAView(item)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>הצג תעודת אנליזה</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCOAUpload(item)}
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>העלה תעודת אנליזה</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Handle Button */}
                  {shouldShowHandleButton && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onHandleItem(item)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>טפל בפריט</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Edit Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8 text-slate-600 hover:bg-slate-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>ערוך</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Delete Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>מחק</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
            );
          }

          const value = item[column.accessor];
          let cellContent;

          switch (column.accessor) {
            case 'reagent_name':
              cellContent = <span className="font-medium text-slate-800 text-xs leading-tight">{value}</span>;
              break;
            case 'batch_number':
              cellContent = <Link to={createPageUrl(`EditReagentBatch?id=${item.reagent_batch_id}`)} className="text-blue-600 hover:underline font-mono text-xs">{value}</Link>;
              break;
            case 'expiry_date':
            case 'receipt_date':
            case 'first_use_date':
            case 'manufacture_date':
              if (!value) cellContent = <span className="text-xs text-gray-400">N/A</span>;
              else {
                const date = parseISO(value);
                cellContent = <span className="text-xs">{isValid(date) ? format(date, 'dd/MM/yyyy') : 'תאריך לא תקין'}</span>;
              }
              break;
            case 'delivery_number':
              cellContent = item.delivery_id ?
                <Link to={createPageUrl(`EditDelivery?id=${item.delivery_id}`)} className="text-blue-600 hover:underline text-xs">{value}</Link> :
                <span className="text-xs text-gray-500">{value || 'N/A'}</span>;
              break;
            case 'current_quantity':
            case 'initial_quantity':
            case 'receipt_quantity':
            case 'status_quantity': // ADDED THIS CASE
              cellContent = <span className="text-xs font-mono">{formatQuantity(value)}</span>;
              break;
            case 'status':
              const statusColors = {
                active: 'bg-green-100 text-green-800',
                expired: 'bg-red-100 text-red-800',
                quarantine: 'bg-yellow-100 text-yellow-800',
                consumed: 'bg-slate-100 text-slate-700',
                disposed: 'bg-gray-100 text-gray-800', // Added 'disposed' status
              };
              cellContent = <Badge className={`${statusColors[value] || 'bg-gray-100 text-gray-800'} text-xs px-1 py-0`}>{value}</Badge>;
              break;
            case 'coa_documents':
              cellContent = Array.isArray(value) && value.length > 0 ? '✔️' : '❌';
              break;
            default:
              // Handle potential objects or complex values safely
              if (value === null || value === undefined) {
                cellContent = <span className="text-xs text-gray-400">N/A</span>;
              } else if (typeof value === 'object') {
                // If it's an object, don't render it directly
                cellContent = <span className="text-xs text-gray-400">—</span>;
              } else {
                cellContent = <span className="text-xs">{String(value)}</span>;
              }
              break;
          }
          
          return (
            <td key={column.accessor} className="px-2 py-2 lg:py-2.5 text-xs text-slate-700 align-middle border-l border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {cellContent}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="w-full border border-slate-200 rounded-lg bg-white shadow-sm">
      {/* גלילה רוחבית וכותרות דביקות עם תיקון RTL */}
      <div className="overflow-auto max-h-[75vh]" style={{ overflowX: 'auto', overflowY: 'auto' }}>
        <table className="w-full" style={{ tableLayout: 'fixed', minWidth: `${visibleColumns.reduce((acc, col) => acc + (columnWidths[col.accessor] || 120), 0)}px` }}>
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {visibleColumns.map(column => (
                <th
                  key={column.accessor}
                  className="px-2 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider border-b-2 border-slate-300 relative bg-slate-50"
                  style={{ width: columnWidths[column.accessor], minWidth: columnWidths[column.accessor] }}
                >
                  <SortableHeader column={column.accessor} sortConfig={{ key: sortField, direction: sortDirection }} onSort={onSort}>
                    <span className="text-xs leading-tight">{column.Header}</span>
                  </SortableHeader>
                  {/* תיקון RTL: מיקום הידית בצד שמאל */}
                  <div
                      onMouseDown={() => handleMouseDown(column.accessor)}
                      className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-blue-300 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(item => (
              <TableRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
