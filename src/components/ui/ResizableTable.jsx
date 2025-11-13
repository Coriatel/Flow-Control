import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * ResizableTable - טבלה עם עמודות הניתנות לשינוי גודל, תמיכה ב-RTL ומיון
 * 
 * Props:
 * - columns: מערך של הגדרות עמודות { key, label, defaultWidth, sortable, alwaysVisible }
 * - data: מערך הנתונים להצגה
 * - visibleColumns: מערך של מפתחות העמודות הגלויות
 * - sortField: שדה המיון הנוכחי
 * - sortDirection: כיוון המיון ('asc' או 'desc')
 * - onSort: פונקציה לטיפול בשינוי מיון
 * - renderCell: פונקציה לרינדור תא (item, columnKey)
 */
export default function ResizableTable({
  columns = [],
  data = [],
  visibleColumns = [],
  sortField = '',
  sortDirection = 'asc',
  onSort = () => {},
  renderCell = () => null
}) {
  // State for column widths
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = {};
    columns.forEach(col => {
      widths[col.key] = col.defaultWidth || 150;
    });
    return widths;
  });

  const [resizing, setResizing] = useState(null);
  const tableRef = useRef(null);

  // Load saved widths from localStorage
  useEffect(() => {
    const savedWidths = localStorage.getItem('tableColumnWidths');
    if (savedWidths) {
      try {
        const parsed = JSON.parse(savedWidths);
        setColumnWidths(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to parse saved column widths');
      }
    }
  }, []);

  // Save widths to localStorage
  useEffect(() => {
    localStorage.setItem('tableColumnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const handleMouseDown = (columnKey, e) => {
    e.preventDefault();
    setResizing({
      columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey]
    });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e) => {
      // RTL: reverse the movement direction
      const diff = -(e.clientX - resizing.startX);
      const newWidth = Math.max(80, resizing.startWidth + diff);
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing.columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const visibleColumnConfigs = columns.filter(col => visibleColumns.includes(col.key));

  return (
    <div className="overflow-x-auto" ref={tableRef}>
      <table className="w-full border-collapse">
        <thead className="bg-slate-100 sticky top-0 z-10">
          <tr>
            {visibleColumnConfigs.map((column) => (
              <th
                key={column.key}
                className="text-right px-4 py-3 font-semibold text-slate-700 border-b-2 border-slate-300 relative group"
                style={{ minWidth: `${columnWidths[column.key]}px` }}
              >
                <div className="flex items-center justify-between">
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key)}
                      className="flex items-center gap-2 hover:text-slate-900 transition-colors w-full text-right"
                    >
                      <span>{column.label}</span>
                      {sortField === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </div>

                {/* Resize Handle - RTL: on the LEFT side */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleMouseDown(column.key, e)}
                  style={{ touchAction: 'none' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {visibleColumnConfigs.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-slate-700"
                  style={{ minWidth: `${columnWidths[column.key]}px` }}
                >
                  {renderCell(item, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}