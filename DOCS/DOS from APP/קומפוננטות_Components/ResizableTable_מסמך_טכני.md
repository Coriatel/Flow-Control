# מסמך טכני - טבלה מתכווננת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/ResizableTable.jsx

---

# מסמך טכני - ResizableTable

## Implementation

```jsx
import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ResizableTable({
  columns,
  data,
  onRowClick,
  searchable = true,
  sortable = true,
  exportable = true,
  pageSize = 50,
  mobileBreakpoint = 768
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < mobileBreakpoint);
  
  // Responsive detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < mobileBreakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Search + Sort + Pagination
  const processedData = useMemo(() => {
    let filtered = data;
    
    // Search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col => 
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Pagination
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [data, searchTerm, sortConfig, currentPage]);
  
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };
  
  const handleExport = () => {
    const csv = [columns.map(c => c.label).join(',')];
    data.forEach(row => {
      csv.push(columns.map(c => row[c.key]).join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.csv';
    link.click();
  };
  
  // Mobile: Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {searchable && (
          <Input
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
        
        {processedData.map((row, idx) => (
          <Card key={idx} onClick={() => onRowClick?.(row)} className="p-4 cursor-pointer">
            {columns.map(col => (
              <div key={col.key} className="flex justify-between py-1">
                <span className="text-sm text-gray-600">{col.label}:</span>
                <span className="font-medium">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }
  
  // Desktop: Table View
  return (
    <div>
      <div className="flex justify-between mb-4">
        {searchable && (
          <div className="relative w-64">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        )}
        
        {exportable && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 ml-2" />
            ייצוא
          </Button>
        )}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead 
                key={col.key}
                onClick={() => sortable && col.sortable !== false && handleSort(col.key)}
                className={sortable && col.sortable !== false ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortable && col.sortable !== false && <ArrowUpDown className="h-4 w-4" />}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedData.map((row, idx) => (
            <TableRow 
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              {columns.map(col => (
                <TableCell key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Performance

- useMemo for processed data
- Pagination to limit DOM nodes
- Virtual scrolling for 1000+ rows (optional)

## Dependencies

- `@/components/ui/table`
- `@/components/ui/input`
- `@/components/ui/button`
- `@/components/ui/card`
- `lucide-react`