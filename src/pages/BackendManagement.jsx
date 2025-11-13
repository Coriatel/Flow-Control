import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Server, Code, Download } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function BackendManagementPage() {
  const { toast } = useToast();
  const [copiedFunction, setCopiedFunction] = useState(null);

  const copyToClipboard = async (code, functionName) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFunction(functionName);
      toast({
        title: "הועתק בהצלחה!",
        description: `קוד ${functionName} הועתק ללוח`,
        variant: "default"
      });
      setTimeout(() => setCopiedFunction(null), 2000);
    } catch (error) {
      toast({
        title: "שגיאה בהעתקה",
        description: "לא ניתן להעתיק ללוח",
        variant: "destructive"
      });
    }
  };

  // Backend Functions Code
  const backendFunctions = {
    initializeCatalog: `// Initialize Complete Catalog - Backend Function
// Function name: initializeCatalog

async function initializeCatalog(context) {
  const { logger } = context;
  
  try {
    logger.info('Starting catalog initialization...');
    
    // Complete catalog data from PDF document - 85 items total
    const catalogData = [
      // ריאגנטים Eldan (26 פריטים)
      { name: "Anti-IgG Green", catalog_number: "ELD-001", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 2, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "Anti-D", catalog_number: "ELD-002", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 5, max_stock_level: 20, reorder_point: 8, active: true },
      { name: "Anti-A", catalog_number: "ELD-003", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 5, max_stock_level: 20, reorder_point: 8, active: true },
      { name: "Anti-B", catalog_number: "ELD-004", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 5, max_stock_level: 20, reorder_point: 8, active: true },
      { name: "Anti-C", catalog_number: "ELD-005", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Anti-c", catalog_number: "ELD-006", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Anti-K", catalog_number: "ELD-007", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "Anti-M", catalog_number: "ELD-008", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-e", catalog_number: "ELD-009", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Anti-P1", catalog_number: "ELD-010", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-N", catalog_number: "ELD-011", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-A1", catalog_number: "ELD-012", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-Jka", catalog_number: "ELD-013", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-Jkb", catalog_number: "ELD-014", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Elu-kit II", catalog_number: "ELD-015", supplier: "ELDAN", category: "reagents", subcategory: "Elution", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "ChloroQuin", catalog_number: "ELD-016", supplier: "ELDAN", category: "reagents", subcategory: "Treatment", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "Anti-k", catalog_number: "ELD-017", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Ficin", catalog_number: "ELD-018", supplier: "ELDAN", category: "reagents", subcategory: "Enzyme", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "Anti-E", catalog_number: "ELD-019", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Anti-S", catalog_number: "ELD-020", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-s", catalog_number: "ELD-021", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-Fya", catalog_number: "ELD-022", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-Fyb", catalog_number: "ELD-023", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-H", catalog_number: "ELD-024", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Anti-Kpa", catalog_number: "ELD-025", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "Anti-Lua", catalog_number: "ELD-026", supplier: "ELDAN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      
      // ספקים אחרים - ריאגנטים (7 פריטים)
      { name: "מדבקות הקרנה", catalog_number: "OTHER-001", supplier: "OTHER", category: "reagents", subcategory: "Labels", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 1, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "PBS", catalog_number: "OTHER-002", supplier: "OTHER", category: "solutions", subcategory: "Buffer", unit_of_measure: "ml", package_size: 500, storage_temperature: "room_temp", shelf_life_months: 36, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "אבקת DTT", catalog_number: "OTHER-003", supplier: "OTHER", category: "reagents", subcategory: "Treatment", unit_of_measure: "bottles", package_size: 1, storage_temperature: "room_temp", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "DTT 0.01M מבחנות", catalog_number: "OTHER-004", supplier: "OTHER", category: "reagents", subcategory: "Treatment", unit_of_measure: "vials", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "DTT 0.2M מבחנות", catalog_number: "OTHER-005", supplier: "OTHER", category: "reagents", subcategory: "Treatment", unit_of_measure: "vials", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "DTT 1M 1ml in H2O", catalog_number: "OTHER-006", supplier: "OTHER", category: "reagents", subcategory: "Treatment", unit_of_measure: "vials", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "DaraEx", catalog_number: "OTHER-007", supplier: "OTHER", category: "reagents", subcategory: "Treatment", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      
      // BioRad - ריאגנטים (15 פריטים)
      { name: "Anti IgG", catalog_number: "BIO-001", supplier: "BIORAD", category: "reagents", subcategory: "Antiglobulin", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 3, max_stock_level: 15, reorder_point: 6, active: true },
      { name: "Diluent II 500 ml", catalog_number: "BIO-002", supplier: "BIORAD", category: "solutions", subcategory: "Diluent", unit_of_measure: "ml", package_size: 500, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "TIPS", catalog_number: "BIO-003", supplier: "BIORAD", category: "reagents", subcategory: "Tips", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 5, max_stock_level: 50, reorder_point: 15, active: true },
      { name: "Liss/Coombs", catalog_number: "BIO-004", supplier: "BIORAD", category: "reagents", subcategory: "Enhancement", unit_of_measure: "ml", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Newborn", catalog_number: "BIO-005", supplier: "BIORAD", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "DC screening II", catalog_number: "BIO-006", supplier: "BIORAD", category: "cells", subcategory: "Screening", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "ABO/D+Reverse Group", catalog_number: "BIO-007", supplier: "BIORAD", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "ABD-Confimation", catalog_number: "BIO-008", supplier: "BIORAD", category: "reagents", subcategory: "Confirmation", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "Anti Fya", catalog_number: "BIO-009", supplier: "BIORAD", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "DC screening I", catalog_number: "BIO-010", supplier: "BIORAD", category: "cells", subcategory: "Screening", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Anti Cw", catalog_number: "BIO-011", supplier: "BIORAD", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "ml", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "ID Anti-IgG1/IgG3", catalog_number: "BIO-012", supplier: "BIORAD", category: "reagents", subcategory: "Antiglobulin", unit_of_measure: "ml", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "Diluent II for IH-1000", catalog_number: "BIO-013", supplier: "BIORAD", category: "solutions", subcategory: "Diluent", unit_of_measure: "ml", package_size: 1000, storage_temperature: "2_8_celsius", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "DECON 90", catalog_number: "BIO-014", supplier: "BIORAD", category: "solutions", subcategory: "Cleaning", unit_of_measure: "ml", package_size: 500, storage_temperature: "room_temp", shelf_life_months: 36, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "Microcide SQ", catalog_number: "BIO-015", supplier: "BIORAD", category: "solutions", subcategory: "Disinfection", unit_of_measure: "ml", package_size: 500, storage_temperature: "room_temp", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      
      // Dyn - ריאגנטים (12 פריטים)
      { name: "A,B,D,CTL,REV 100 CAS", catalog_number: "DYN-001", supplier: "DYN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "tests", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 5, max_stock_level: 25, reorder_point: 10, active: true },
      { name: "Poly AHG 100 CAS", catalog_number: "DYN-002", supplier: "DYN", category: "reagents", subcategory: "Antiglobulin", unit_of_measure: "tests", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 3, max_stock_level: 15, reorder_point: 6, active: true },
      { name: "A,B,D 100 CAS", catalog_number: "DYN-003", supplier: "DYN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "tests", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 3, max_stock_level: 15, reorder_point: 6, active: true },
      { name: "NEWBORN 100 CAS", catalog_number: "DYN-004", supplier: "DYN", category: "reagents", subcategory: "Blood Grouping", unit_of_measure: "tests", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "ANTI-IGG CAS", catalog_number: "DYN-005", supplier: "DYN", category: "reagents", subcategory: "Antiglobulin", unit_of_measure: "tests", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "RCD", catalog_number: "DYN-006", supplier: "DYN", category: "cells", subcategory: "Control", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "BLISS", catalog_number: "DYN-007", supplier: "DYN", category: "solutions", subcategory: "Enhancement", unit_of_measure: "ml", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "DILUTION TRAY", catalog_number: "DYN-008", supplier: "DYN", category: "reagents", subcategory: "Equipment", unit_of_measure: "kits", package_size: 10, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "Evapotation Caps 10ml", catalog_number: "DYN-009", supplier: "DYN", category: "reagents", subcategory: "Equipment", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 1, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "Evapotation Caps 3ml", catalog_number: "DYN-010", supplier: "DYN", category: "reagents", subcategory: "Equipment", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 1, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "BSA 7%", catalog_number: "DYN-011", supplier: "DYN", category: "solutions", subcategory: "Enhancement", unit_of_measure: "ml", package_size: 100, storage_temperature: "2_8_celsius", shelf_life_months: 18, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "NaOH", catalog_number: "DYN-012", supplier: "DYN", category: "solutions", subcategory: "Treatment", unit_of_measure: "ml", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 24, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      
      // Eldan - כדוריות (6 פריטים)
      { name: "REFERENCELLS A1,B", catalog_number: "ELD-C001", supplier: "ELDAN", category: "cells", subcategory: "Reference", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "PANOSCREEN I,II&III", catalog_number: "ELD-C002", supplier: "ELDAN", category: "cells", subcategory: "Screening", unit_of_measure: "vials", package_size: 15, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "CHECKCELLS", catalog_number: "ELD-C003", supplier: "ELDAN", category: "cells", subcategory: "Quality Control", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "REFERENCELLS A2", catalog_number: "ELD-C004", supplier: "ELDAN", category: "cells", subcategory: "Reference", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 8, reorder_point: 3, active: true },
      { name: "CORQC TEST SYSTEM", catalog_number: "ELD-C005", supplier: "ELDAN", category: "cells", subcategory: "Quality Control", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "PANOCELL 10", catalog_number: "ELD-C006", supplier: "ELDAN", category: "cells", subcategory: "Panel", unit_of_measure: "vials", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      
      // BioRad - כדוריות (15 פריטים)
      { name: "DIAPANEL (11x4ML)", catalog_number: "BIO-C001", supplier: "BIORAD", category: "cells", subcategory: "Panel", unit_of_measure: "vials", package_size: 11, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "DIAPANEL P (11x4ML)", catalog_number: "BIO-C002", supplier: "BIORAD", category: "cells", subcategory: "Panel", unit_of_measure: "vials", package_size: 11, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "DIACELL I-II-III (3x10ML)", catalog_number: "BIO-C003", supplier: "BIORAD", category: "cells", subcategory: "Screening", unit_of_measure: "vials", package_size: 3, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "DIACELL ABO (A1-B)", catalog_number: "BIO-C004", supplier: "BIORAD", category: "cells", subcategory: "Blood Grouping", unit_of_measure: "vials", package_size: 2, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 2, max_stock_level: 10, reorder_point: 4, active: true },
      { name: "PANEL PLUS 6 (6x4ML)", catalog_number: "BIO-C005", supplier: "BIORAD", category: "cells", subcategory: "Panel", unit_of_measure: "vials", package_size: 6, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "IH-QC 1 (4x6ML)", catalog_number: "BIO-C006", supplier: "BIORAD", category: "cells", subcategory: "Quality Control", unit_of_measure: "vials", package_size: 4, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "IH-QC 2 (4x6ML)", catalog_number: "BIO-C007", supplier: "BIORAD", category: "cells", subcategory: "Quality Control", unit_of_measure: "vials", package_size: 4, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "IH-QC 7 (1X6ML)", catalog_number: "BIO-C008", supplier: "BIORAD", category: "cells", subcategory: "Quality Control", unit_of_measure: "vials", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "IH-QC 8 (1X6ML)", catalog_number: "BIO-C009", supplier: "BIORAD", category: "cells", subcategory: "Quality Control", unit_of_measure: "vials", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "DTT 0.2M - סקר מטופל", catalog_number: "BIO-C010", supplier: "BIORAD", category: "reagents", subcategory: "Treatment", unit_of_measure: "vials", package_size: 10, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 5, reorder_point: 2, active: true },
      { name: "PIPETTE BLACK, 1U", catalog_number: "BIO-C012", supplier: "BIORAD", category: "reagents", subcategory: "Equipment", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 1, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "PIPETTE RED, 1U", catalog_number: "BIO-C013", supplier: "BIORAD", category: "reagents", subcategory: "Equipment", unit_of_measure: "kits", package_size: 100, storage_temperature: "room_temp", shelf_life_months: 60, min_stock_level: 1, max_stock_level: 10, reorder_point: 3, active: true },
      { name: "EQAS SHIPMENT C", catalog_number: "BIO-C014", supplier: "BIORAD", category: "cells", subcategory: "Quality Assurance", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 6, min_stock_level: 1, max_stock_level: 3, reorder_point: 1, active: true },
      { name: "EQAS SHIPMENT B", catalog_number: "BIO-C015", supplier: "BIORAD", category: "cells", subcategory: "Quality Assurance", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 6, min_stock_level: 1, max_stock_level: 3, reorder_point: 1, active: true },
      { name: "EQAS SHIPMENT A", catalog_number: "BIO-C016", supplier: "BIORAD", category: "cells", subcategory: "Quality Assurance", unit_of_measure: "kits", package_size: 1, storage_temperature: "2_8_celsius", shelf_life_months: 6, min_stock_level: 1, max_stock_level: 3, reorder_point: 1, active: true },
      
      // Dyn - כדוריות (3 פריטים)
      { name: "0.8% Surgiscreen", catalog_number: "DYN-C001", supplier: "DYN", category: "cells", subcategory: "Screening", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "Affirmagen A1 & B Cells", catalog_number: "DYN-C002", supplier: "DYN", category: "cells", subcategory: "Reference", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true },
      { name: "0.8% RESOLVE PANEL C", catalog_number: "DYN-C003", supplier: "DYN", category: "cells", subcategory: "Panel", unit_of_measure: "vials", package_size: 5, storage_temperature: "2_8_celsius", shelf_life_months: 12, min_stock_level: 1, max_stock_level: 6, reorder_point: 2, active: true }
    ];

    // Get entities from context
    const { ReagentCatalog, Reagent } = context.entities;

    // Step 1: Create catalog items
    logger.info(\`Creating \${catalogData.length} catalog items...\`);
    const catalogResults = [];
    
    for (let i = 0; i < catalogData.length; i++) {
      const item = catalogData[i];
      try {
        const catalogItem = await ReagentCatalog.create(item);
        catalogResults.push(catalogItem);
        
        // Log progress every 10 items
        if ((i + 1) % 10 === 0) {
          logger.info(\`Created \${i + 1}/\${catalogData.length} catalog items\`);
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.error(\`Failed to create catalog item \${item.name}: \${error.message}\`);
        // Continue with other items
      }
    }
    
    logger.info(\`Successfully created \${catalogResults.length} catalog items\`);
    
    // Step 2: Create corresponding reagent entries
    logger.info('Creating reagent entries...');
    const reagentResults = [];
    
    for (let i = 0; i < catalogResults.length; i++) {
      const catalogItem = catalogResults[i];
      try {
        const reagentData = {
          catalog_item_id: catalogItem.id,
          name: catalogItem.name,
          category: catalogItem.category,
          supplier: catalogItem.supplier,
          catalog_number: catalogItem.catalog_number,
          total_quantity_all_batches: 0,
          active_batches_count: 0,
          current_stock_status: 'out_of_stock',
          reservation_quantity: 0,
          available_quantity: 0,
          average_monthly_usage: 0,
          reorder_suggestion: false
        };
        
        const reagent = await Reagent.create(reagentData);
        reagentResults.push(reagent);
        
        // Log progress every 10 items
        if ((i + 1) % 10 === 0) {
          logger.info(\`Created \${i + 1}/\${catalogResults.length} reagent entries\`);
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.error(\`Failed to create reagent for \${catalogItem.name}: \${error.message}\`);
        // Continue with other items
      }
    }
    
    logger.info(\`Successfully created \${reagentResults.length} reagent entries\`);
    
    // Return summary
    const summary = {
      success: true,
      message: \`Successfully initialized catalog with \${catalogResults.length} items and \${reagentResults.length} reagents\`,
      details: {
        catalogItemsCreated: catalogResults.length,
        reagentsCreated: reagentResults.length,
        totalExpected: catalogData.length,
        bySupplier: {
          ELDAN: catalogResults.filter(item => item.supplier === 'ELDAN').length,
          BIORAD: catalogResults.filter(item => item.supplier === 'BIORAD').length,
          DYN: catalogResults.filter(item => item.supplier === 'DYN').length,
          OTHER: catalogResults.filter(item => item.supplier === 'OTHER').length
        },
        byCategory: {
          reagents: catalogResults.filter(item => item.category === 'reagents').length,
          cells: catalogResults.filter(item => item.category === 'cells').length,
          solutions: catalogResults.filter(item => item.category === 'solutions').length
        }
      }
    };
    
    logger.info('Catalog initialization completed successfully', summary);
    return summary;
    
  } catch (error) {
    logger.error('Error in catalog initialization:', error);
    return {
      success: false,
      message: \`Catalog initialization failed: \${error.message}\`,
      error: error.message
    };
  }
}`,

    cleanupDatabase: `// Database Cleanup - Backend Function  
// Function name: cleanupDatabase

async function cleanupDatabase(context) {
  const { logger } = context;
  const { 
    Reagent, 
    ReagentCatalog, 
    ReagentBatch,
    Order,
    OrderItem,
    Delivery,
    DeliveryItem,
    Shipment,
    ShipmentItem,
    InventoryTransaction,
    ExpiredProductLog,
    CompletedInventoryCount,
    InventoryCountDraft
  } = context.entities;
  
  try {
    logger.info('Starting comprehensive database cleanup...');
    
    const results = {
      deletions: {},
      duplicatesRemoved: {},
      errors: []
    };
    
    // Define cleanup order (dependencies first)
    const cleanupOrder = [
      { entity: ShipmentItem, name: 'ShipmentItems' },
      { entity: Shipment, name: 'Shipments' },
      { entity: DeliveryItem, name: 'DeliveryItems' },
      { entity: Delivery, name: 'Deliveries' },
      { entity: OrderItem, name: 'OrderItems' },
      { entity: Order, name: 'Orders' },
      { entity: InventoryTransaction, name: 'InventoryTransactions' },
      { entity: ExpiredProductLog, name: 'ExpiredProductLogs' },
      { entity: CompletedInventoryCount, name: 'CompletedInventoryCounts' },
      { entity: InventoryCountDraft, name: 'InventoryCountDrafts' },
      { entity: ReagentBatch, name: 'ReagentBatches' },
      { entity: Reagent, name: 'Reagents' },
      { entity: ReagentCatalog, name: 'ReagentCatalog' }
    ];
    
    // Step 1: Clean up entities in order
    for (const { entity, name } of cleanupOrder) {
      try {
        logger.info(\`Cleaning up \${name}...\`);
        
        const items = await entity.list();
        let deletedCount = 0;
        
        if (items && items.length > 0) {
          // Process in batches to avoid overwhelming the system
          const batchSize = 50;
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (item) => {
              try {
                await entity.delete(item.id);
                deletedCount++;
              } catch (deleteError) {
                logger.warn(\`Failed to delete \${name} item \${item.id}: \${deleteError.message}\`);
                results.errors.push(\`\${name}:\${item.id} - \${deleteError.message}\`);
              }
            }));
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
            
            logger.info(\`\${name}: Deleted \${deletedCount}/\${items.length} items\`);
          }
        }
        
        results.deletions[name] = deletedCount;
        logger.info(\`Completed \${name} cleanup: \${deletedCount} items deleted\`);
        
      } catch (error) {
        logger.error(\`Error cleaning up \${name}: \${error.message}\`);
        results.errors.push(\`\${name} cleanup failed: \${error.message}\`);
      }
    }
    
    const summary = {
      success: true,
      message: 'Database cleanup completed',
      details: {
        totalDeletions: Object.values(results.deletions).reduce((sum, count) => sum + count, 0),
        deletionsByEntity: results.deletions,
        duplicatesRemoved: results.duplicatesRemoved,
        errorCount: results.errors.length,
        errors: results.errors.slice(0, 10) // First 10 errors only
      }
    };
    
    logger.info('Database cleanup completed', summary);
    return summary;
    
  } catch (error) {
    logger.error('Error in database cleanup:', error);
    return {
      success: false,
      message: \`Database cleanup failed: \${error.message}\`,
      error: error.message
    };
  }
}`,

    enhancedProcessInventoryCount: `// Enhanced Inventory Count Processing - Backend Function
// Function name: enhancedProcessInventoryCount

async function enhancedProcessInventoryCount(context, payload) {
  const { logger } = context;
  const { 
    Reagent, 
    ReagentBatch, 
    InventoryTransaction, 
    CompletedInventoryCount 
  } = context.entities;
  
  const { completedCountId, userId, meaningfulEntries } = payload;
  
  try {
    logger.info(\`Starting enhanced inventory count processing for count \${completedCountId}\`);
    
    // Validate input
    if (!completedCountId || !meaningfulEntries || !userId) {
      throw new Error('Missing required parameters: completedCountId, meaningfulEntries, or userId');
    }
    
    // Get the completed count record
    const completedCount = await CompletedInventoryCount.get(completedCountId);
    if (!completedCount) {
      throw new Error(\`Completed count \${completedCountId} not found\`);
    }
    
    // Process entries with enhanced error handling
    const results = {
      successful: [],
      failed: [],
      created_batches: [],
      updated_reagents: []
    };
    
    const reagentIds = Object.keys(meaningfulEntries);
    logger.info(\`Processing \${reagentIds.length} reagent entries\`);
    
    for (let i = 0; i < reagentIds.length; i++) {
      const reagentId = reagentIds[i];
      const entries = meaningfulEntries[reagentId];
      
      try {
        logger.info(\`Processing reagent \${i + 1}/\${reagentIds.length}: \${reagentId}\`);
        
        // Get current reagent
        const reagent = await Reagent.get(reagentId);
        if (!reagent) {
          results.failed.push({ reagentId, error: 'Reagent not found' });
          continue;
        }
        
        // Process each batch entry for this reagent
        let totalQuantityForReagent = 0;
        let activeBatchesCount = 0;
        
        for (const entry of entries) {
          try {
            // Handle batch creation/update
            if (entry.quantity > 0) {
              // Try to find existing batch first
              const existingBatches = await ReagentBatch.filter({
                catalog_item_id: reagent.catalog_item_id,
                batch_number: entry.batch_number,
                expiry_date: entry.expiry_date
              });
              
              let batch;
              if (existingBatches.length > 0) {
                // Update existing batch
                batch = existingBatches[0];
                await ReagentBatch.update(batch.id, {
                  current_quantity: entry.quantity,
                  status: 'active'
                });
                logger.info(\`Updated existing batch \${entry.batch_number} for reagent \${reagent.name}\`);
              } else {
                // Create new batch
                batch = await ReagentBatch.create({
                  catalog_item_id: reagent.catalog_item_id,
                  batch_number: entry.batch_number,
                  expiry_date: entry.expiry_date,
                  current_quantity: entry.quantity,
                  initial_quantity: entry.quantity,
                  status: 'active',
                  received_date: new Date().toISOString().split('T')[0]
                });
                results.created_batches.push(batch);
                logger.info(\`Created new batch \${entry.batch_number} for reagent \${reagent.name}\`);
              }
              
              // Create inventory transaction
              await InventoryTransaction.create({
                reagent_id: reagentId,
                transaction_type: 'count_update',
                quantity: entry.quantity,
                batch_number: entry.batch_number,
                expiry_date: entry.expiry_date,
                notes: \`Inventory count update from count \${completedCountId}\`
              });
              
              totalQuantityForReagent += entry.quantity;
              activeBatchesCount++;
            }
          } catch (batchError) {
            logger.error(\`Error processing batch \${entry.batch_number}: \${batchError.message}\`);
            results.failed.push({ 
              reagentId, 
              batchNumber: entry.batch_number, 
              error: batchError.message 
            });
          }
        }
        
        // Update reagent totals
        const stockStatus = totalQuantityForReagent === 0 ? 'out_of_stock' : 
                           totalQuantityForReagent <= (reagent.min_stock_level || 0) ? 'low_stock' : 'in_stock';
        
        await Reagent.update(reagentId, {
          total_quantity_all_batches: totalQuantityForReagent,
          active_batches_count: activeBatchesCount,
          current_stock_status: stockStatus,
          available_quantity: totalQuantityForReagent - (reagent.reservation_quantity || 0),
          last_count_date: new Date().toISOString().split('T')[0]
        });
        
        results.updated_reagents.push(reagentId);
        results.successful.push({ reagentId, totalQuantity: totalQuantityForReagent });
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (reagentError) {
        logger.error(\`Error processing reagent \${reagentId}: \${reagentError.message}\`);
        results.failed.push({ reagentId, error: reagentError.message });
      }
    }
    
    // Update completed count status
    await CompletedInventoryCount.update(completedCountId, {
      reagent_updates_completed: true,
      reagents_updated_count: results.successful.length,
      reagents_total_count: reagentIds.length
    });
    
    const summary = {
      success: true,
      message: \`Processed \${results.successful.length}/\${reagentIds.length} reagents successfully\`,
      details: {
        totalReagents: reagentIds.length,
        successfulUpdates: results.successful.length,
        failedUpdates: results.failed.length,
        batchesCreated: results.created_batches.length,
        reagentsUpdated: results.updated_reagents.length,
        errors: results.failed.slice(0, 5) // First 5 errors only
      }
    };
    
    logger.info('Enhanced inventory count processing completed', summary);
    return summary;
    
  } catch (error) {
    logger.error('Error in enhanced inventory count processing:', error);
    return {
      success: false,
      message: \`Enhanced inventory processing failed: \${error.message}\`,
      error: error.message
    };
  }
}`
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ניהול Backend Functions</h1>
      
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Server className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>הוראות שימוש:</strong> העתק את הקוד מכל פונקציה והעלה אותה ל-Backend Functions בbase44 (Workspace → Settings → Backend Functions).
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="initializeCatalog" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="initializeCatalog" className="text-sm">
            <Code className="h-4 w-4 mr-2" />
            קטלוג מלא
          </TabsTrigger>
          <TabsTrigger value="cleanupDatabase" className="text-sm">
            <Code className="h-4 w-4 mr-2" />
            ניקוי מסד נתונים
          </TabsTrigger>
          <TabsTrigger value="enhancedProcessInventoryCount" className="text-sm">
            <Code className="h-4 w-4 mr-2" />
            עיבוד ספירות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="initializeCatalog">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="h-6 w-6 mr-2 text-green-600" />
                  initializeCatalog - יצירת קטלוג מלא
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">85 פריטים</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(backendFunctions.initializeCatalog, 'initializeCatalog')}
                    className="flex items-center gap-2"
                  >
                    {copiedFunction === 'initializeCatalog' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    העתק קוד
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">מה הפונקציה עושה:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• יוצרת 85 פריטי קטלוג מהמסמך המקורי</li>
                    <li>• יוצרת ריאגנטים מקושרים לכל פריט</li>
                    <li>• מעבדת בכמויות קטנות למניעת עומסים</li>
                    <li>• מחזירה דיווח מפורט על ההתקדמות</li>
                  </ul>
                </div>
                
                <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-900 text-green-400 font-mono text-xs">
                  <pre>{backendFunctions.initializeCatalog}</pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanupDatabase">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="h-6 w-6 mr-2 text-red-600" />
                  cleanupDatabase - ניקוי מסד נתונים
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backendFunctions.cleanupDatabase, 'cleanupDatabase')}
                  className="flex items-center gap-2"
                >
                  {copiedFunction === 'cleanupDatabase' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  העתק קוד
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    <strong>זהירות:</strong> פונקציה זו מוחקת את כל הנתונים במערכת. השתמש בה רק לניקוי מלא!
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">מה הפונקציה עושה:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• מוחקת את כל הישויות בסדר נכון</li>
                    <li>• מטפלת בתלויות בין ישויות</li>
                    <li>• מעבדת במנות קטנות</li>
                    <li>• מדווחת על שגיאות ומתקדמת הלאה</li>
                  </ul>
                </div>
                
                <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-900 text-green-400 font-mono text-xs">
                  <pre>{backendFunctions.cleanupDatabase}</pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhancedProcessInventoryCount">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Server className="h-6 w-6 mr-2 text-blue-600" />
                  enhancedProcessInventoryCount - עיבוד ספירות משופר
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backendFunctions.enhancedProcessInventoryCount, 'enhancedProcessInventoryCount')}
                  className="flex items-center gap-2"
                >
                  {copiedFunction === 'enhancedProcessInventoryCount' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  העתק קוד
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">מה הפונקציה עושה:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• מעבדת ספירות מלאי בצורה משופרת</li>
                    <li>• יוצרת/מעדכנת אצוות ריאגנטים</li>
                    <li>• מעדכנת כמויות ומצב מלאי</li>
                    <li>• יוצרת תנועות מלאי</li>
                    <li>• טיפול מתקדם בשגיאות</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">פרמטרים נדרשים:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <code>completedCountId</code> - מזהה הספירה המושלמת</li>
                    <li>• <code>userId</code> - מזהה המשתמש</li>
                    <li>• <code>meaningfulEntries</code> - נתוני הספירה</li>
                  </ul>
                </div>
                
                <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-900 text-green-400 font-mono text-xs">
                  <pre>{backendFunctions.enhancedProcessInventoryCount}</pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>שלבי העלאה לbase44</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">1. היכנס ל-Workspace</h4>
              <p className="text-sm text-gray-600">פתח את base44 ועבור ל-Workspace</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">2. הגדרות</h4>
              <p className="text-sm text-gray-600">לחץ על Settings → Backend Functions</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">3. יצירת פונקציה חדשה</h4>
              <p className="text-sm text-gray-600">לחץ על + Add Function</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">4. העתק והדבק</h4>
              <p className="text-sm text-gray-600">העתק את הקוד מהטאב המתאים והדבק</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}