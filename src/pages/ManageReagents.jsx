import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Reagent } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { formatQuantity } from "@/components/utils/formatters";
import {
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Columns3,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ResizableTable from "@/components/ui/ResizableTable";
import ReagentCard from "../components/reagents/ReagentCard";

const categoryLabels = {
  reagents: "ריאגנטים",
  cells: "כדוריות",
  controls: "בקרות",
  solutions: "תמיסות",
  consumables: "מתכלים",
};

const stockStatusLabels = {
  in_stock: "במלאי",
  low_stock: "מלאי נמוך",
  out_of_stock: "אזל מהמלאי",
  overstocked: "מלאי עודף",
};

const stockStatusVariants = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
  overstocked: "info",
};

export default function ManageReagentsPage() {
  const navigate = useNavigate();

  const [reagents, setReagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [requiresBatchFilter, setRequiresBatchFilter] = useState("all");
  const [sortField, setSortField] = useState(
    () => localStorage.getItem("manageReagents_sortField") || "name",
  );
  const [sortDirection, setSortDirection] = useState(
    () => localStorage.getItem("manageReagents_sortDirection") || "asc",
  );
  useEffect(() => {
    localStorage.setItem("manageReagents_sortField", sortField);
    localStorage.setItem("manageReagents_sortDirection", sortDirection);
  }, [sortField, sortDirection]);

  // Mobile filter sheet state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("manageReagentsVisibleColumns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [
          "name",
          "catalog_number",
          "supplier",
          "category",
          "total_quantity_all_batches",
          "current_stock_status",
          "nearest_expiry_date",
          "validation_status",
          "actions",
        ];
      }
    }
    return [
      "name",
      "catalog_number",
      "supplier",
      "category",
      "total_quantity_all_batches",
      "current_stock_status",
      "nearest_expiry_date",
      "validation_status",
      "actions",
    ];
  });

  const allColumns = [
    {
      key: "name",
      label: "שם ריאגנט",
      alwaysVisible: true,
      defaultWidth: 200,
      sortable: true,
    },
    { key: "catalog_number", label: 'מק"ט', defaultWidth: 130, sortable: true },
    { key: "supplier", label: "ספק", defaultWidth: 150, sortable: true },
    { key: "category", label: "קטגוריה", defaultWidth: 120, sortable: true },
    {
      key: "total_quantity_all_batches",
      label: "כמות כוללת",
      defaultWidth: 120,
      sortable: true,
    },
    {
      key: "active_batches_count",
      label: "מס' אצוות",
      defaultWidth: 110,
      sortable: true,
    },
    {
      key: "current_stock_status",
      label: "סטטוס מלאי",
      defaultWidth: 130,
      sortable: true,
    },
    {
      key: "nearest_expiry_date",
      label: "תפוגה קרובה",
      defaultWidth: 130,
      sortable: true,
    },
    {
      key: "requires_batches",
      label: "דורש אצווה",
      defaultWidth: 110,
      sortable: false,
    },
    {
      key: "requires_expiry_date",
      label: "דורש תפוגה",
      defaultWidth: 110,
      sortable: false,
    },
    {
      key: "requires_coa",
      label: "דורש COA",
      defaultWidth: 110,
      sortable: false,
    },
    {
      key: "validation_status",
      label: "תקינות נתונים",
      defaultWidth: 140,
      sortable: false,
    },
    {
      key: "actions",
      label: "פעולות",
      alwaysVisible: true,
      defaultWidth: 100,
      sortable: false,
    },
  ];

  // Save visible columns
  useEffect(() => {
    localStorage.setItem(
      "manageReagentsVisibleColumns",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  const fetchReagents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Reagent.list();

      const processedData = data.map((reagent) => {
        const missingFields = [];
        let hasValidationIssues = false;

        if (!reagent.catalog_number || reagent.catalog_number.trim() === "") {
          missingFields.push("catalog_number");
          hasValidationIssues = true;
        }
        if (!reagent.supplier) {
          missingFields.push("supplier");
          hasValidationIssues = true;
        }
        if (!reagent.category) {
          missingFields.push("category");
          hasValidationIssues = true;
        }

        return {
          ...reagent,
          hasValidationIssues,
          missingFields,
        };
      });

      setReagents(processedData);
    } catch (error) {
      toast.error("שגיאה בטעינת ריאגנטים", {
        description: "לא ניתן היה לטעון את רשימת הריאגנטים",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReagents();
  }, [fetchReagents]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(
      reagents.map((r) => r.supplier?.name).filter(Boolean),
    );
    return Array.from(suppliers).sort();
  }, [reagents]);

  const filteredAndSortedReagents = useMemo(() => {
    let filtered = [...reagents];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reagent) =>
          reagent.name?.toLowerCase().includes(term) ||
          reagent.catalog_number?.toLowerCase().includes(term) ||
          reagent.supplier?.name?.toLowerCase().includes(term),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (reagent) => reagent.category === categoryFilter,
      );
    }

    if (supplierFilter !== "all") {
      filtered = filtered.filter(
        (reagent) => reagent.supplier?.name === supplierFilter,
      );
    }

    if (stockStatusFilter !== "all") {
      filtered = filtered.filter(
        (reagent) => reagent.current_stock_status === stockStatusFilter,
      );
    }

    if (requiresBatchFilter !== "all") {
      const requiresBatch = requiresBatchFilter === "yes";
      filtered = filtered.filter(
        (reagent) => reagent.requires_batches === requiresBatch,
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "nearest_expiry_date") {
        aValue = aValue ? new Date(aValue) : new Date("9999-12-31");
        bValue = bValue ? new Date(bValue) : new Date("9999-12-31");
      }

      if (typeof aValue === "string") {
        aValue = aValue?.toLowerCase() || "";
        bValue = bValue?.toLowerCase() || "";
      }

      if (typeof aValue === "number") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    reagents,
    searchTerm,
    categoryFilter,
    supplierFilter,
    stockStatusFilter,
    requiresBatchFilter,
    sortField,
    sortDirection,
  ]);

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(key);
      setSortDirection("asc");
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((k) => k !== columnKey)
        : [...prev, columnKey],
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setStockStatusFilter("all");
    setRequiresBatchFilter("all");
  };

  const renderCell = (reagent, columnKey) => {
    switch (columnKey) {
      case "name":
        return (
          <Link
            to={createPageUrl(`EditReagent?id=${reagent.id}`)}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-2"
          >
            {reagent.name}
            {reagent.hasValidationIssues && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </Link>
        );
      case "catalog_number":
        return (
          <Link
            to={createPageUrl(`EditReagent?id=${reagent.id}`)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {reagent.catalog_number || (
              <span className="text-amber-500">חסר</span>
            )}
          </Link>
        );
      case "supplier":
        return (
          reagent.supplier?.name || (
            <span className="text-amber-500">לא צוין</span>
          )
        );
      case "category":
        return categoryLabels[reagent.category] || reagent.category;
      case "total_quantity_all_batches":
        return (
          <span
            className={
              reagent.total_quantity_all_batches === 0
                ? "text-red-600 font-semibold"
                : ""
            }
          >
            {formatQuantity(reagent.total_quantity_all_batches || 0)}
          </span>
        );
      case "active_batches_count":
        return reagent.active_batches_count || 0;
      case "current_stock_status":
        return (
          <Badge
            variant={
              stockStatusVariants[reagent.current_stock_status] || "outline"
            }
          >
            {stockStatusLabels[reagent.current_stock_status] ||
              reagent.current_stock_status}
          </Badge>
        );
      case "nearest_expiry_date":
        if (!reagent.nearest_expiry_date)
          return <span className="text-gray-400">אין</span>;
        const expiryDate = new Date(reagent.nearest_expiry_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiryDate - now) / (1000 * 60 * 60 * 24),
        );
        const isExpired = daysUntilExpiry < 0;
        const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 90;

        return (
          <span
            className={`${isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-medium" : ""}`}
          >
            {new Date(reagent.nearest_expiry_date).toLocaleDateString("he-IL")}
          </span>
        );
      case "requires_batches":
        return reagent.requires_batches ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
        );
      case "requires_expiry_date":
        return reagent.requires_expiry_date ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
        );
      case "requires_coa":
        return reagent.requires_coa ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
        );
      case "validation_status":
        return reagent.hasValidationIssues ? (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3" />
            חסרים {reagent.missingFields.length} שדות
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            תקין
          </Badge>
        );
      case "actions":
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate(createPageUrl(`EditReagent?id=${reagent.id}`))
              }
              title="עריכה"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return reagent[columnKey] || "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <BackButton />
          <div className="ms-3">
            <h1 className="text-2xl font-bold">ניהול ריאגנטים</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              צפייה ועריכה של כל הריאגנטים במערכת
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchReagents} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate(createPageUrl("NewReagent"))}>
            <Plus className="h-4 w-4 me-2" />
            ריאגנט חדש
          </Button>
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="mb-6 hidden lg:block">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש לפי שם, מק״ט, ספק..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pe-10 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הספקים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הספקים</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stockStatusFilter}
              onValueChange={setStockStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל סטטוסי המלאי</SelectItem>
                {Object.entries(stockStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Select
              value={requiresBatchFilter}
              onValueChange={setRequiresBatchFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="דורש אצווה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הריאגנטים</SelectItem>
                <SelectItem value="yes">דורש אצווה</SelectItem>
                <SelectItem value="no">לא דורש אצווה</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                נקה מסננים
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Columns3 className="h-4 w-4 me-2" />
                    עמודות
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">הצג עמודות</h4>
                    {allColumns.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Checkbox
                          id={column.key}
                          checked={visibleColumns.includes(column.key)}
                          onCheckedChange={() =>
                            toggleColumnVisibility(column.key)
                          }
                          disabled={column.alwaysVisible}
                        />
                        <label
                          htmlFor={column.key}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {column.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Filters - Compact Bar with Sheet */}
      <div className="lg:hidden mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pe-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMobileFilterOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Sheet with Glassmorphism */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md glassmorphism-dark"
          style={{
            background: "rgba(30, 41, 59, 0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-white">סינון ריאגנטים</SheetTitle>
            <SheetDescription className="text-gray-300">
              בחר אפשרויות לסינון רשימת הריאגנטים
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-white">קטגוריה</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">ספק</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הספקים</SelectItem>
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">סטטוס מלאי</Label>
              <Select
                value={stockStatusFilter}
                onValueChange={setStockStatusFilter}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  {Object.entries(stockStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">דורש אצווה</Label>
              <Select
                value={requiresBatchFilter}
                onValueChange={setRequiresBatchFilter}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="yes">דורש אצווה</SelectItem>
                  <SelectItem value="no">לא דורש</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">עמודות גלויות</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {allColumns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <Checkbox
                      id={`mobile-${column.key}`}
                      checked={visibleColumns.includes(column.key)}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                      disabled={column.alwaysVisible}
                      className="border-white/30"
                    />
                    <label
                      htmlFor={`mobile-${column.key}`}
                      className="text-sm text-white cursor-pointer flex-1"
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                נקה
              </Button>
              <Button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 bg-white text-gray-900 hover:bg-white/90"
              >
                החל
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Results Count */}
      <div className="mb-5 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          מציג{" "}
          <span className="font-semibold text-slate-900">
            {filteredAndSortedReagents.length}
          </span>{" "}
          מתוך{" "}
          <span className="font-semibold text-slate-900">
            {reagents.length}
          </span>{" "}
          ריאגנטים
        </div>
        {filteredAndSortedReagents.length === 0 && reagents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700"
          >
            נקה מסננים
          </Button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <ResizableTable
              columns={allColumns}
              data={filteredAndSortedReagents}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              renderCell={renderCell}
            />
            {filteredAndSortedReagents.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">
                  לא נמצאו ריאגנטים
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  נסה לשנות את מילות החיפוש או להסיר מסננים
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  נקה מסננים
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filteredAndSortedReagents.length > 0 ? (
          filteredAndSortedReagents.map((reagent) => (
            <ReagentCard key={reagent.id} reagent={reagent} />
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mb-1">
                לא נמצאו ריאגנטים
              </p>
              <p className="text-sm text-slate-400 mb-3">
                נסה לשנות את החיפוש או להסיר מסננים
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                נקה מסננים
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
