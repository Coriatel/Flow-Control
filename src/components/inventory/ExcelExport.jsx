import React from 'react';
import { format } from 'date-fns';

export default function ExcelExport({ reagents, batchEntries, categories }) {
  
  // Helper function to group reagents by supplier and sort them
  const getGroupedReagents = () => {
    const supplierGroups = {};
    
    // Group by supplier
    reagents.forEach(reagent => {
      if (!supplierGroups[reagent.supplier]) {
        supplierGroups[reagent.supplier] = [];
      }
      supplierGroups[reagent.supplier].push(reagent);
    });
    
    // Sort each group
    Object.keys(supplierGroups).forEach(supplier => {
      supplierGroups[supplier].sort((a, b) => {
        // First sort by category
        if (a.category !== b.category) {
          return a.category === 'cells' ? -1 : 1;
        }
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
    });
    
    return supplierGroups;
  };
  
  // Function to download formatted CSV
  const downloadFormattedCSV = () => {
    const supplierGroups = getGroupedReagents();
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Hebrew support
    let rows = [];
    let itemNumber = 1;
    
    // Add title
    rows.push(["ספירת מלאי בנק דם - " + format(new Date(), "dd/MM/yyyy")]);
    rows.push([]);
    
    // For each supplier, create a section
    Object.keys(supplierGroups).forEach(supplier => {
      // Add supplier header
      rows.push([supplier + " - " + "כדוריות/ריאגנטים"]);
      
      // Add table headers
      rows.push(["מס'", "שם פריט", "כמות", "תאריך תפוגה", "מס' אצווה", "הערות"]);
      
      // Add reagents for this supplier
      supplierGroups[supplier].forEach(reagent => {
        const batchData = batchEntries[reagent.id]?.[0] || {};
        
        rows.push([
          itemNumber,
          reagent.name,
          batchData.quantity || "",
          batchData.expiry_date ? format(new Date(batchData.expiry_date), "dd/MM/yyyy") : "",
          batchData.batch_number || "",
          ""  // הערות (ריק בינתיים)
        ]);
        
        itemNumber++;
      });
      
      // Add empty row after each supplier section
      rows.push([]);
    });
    
    // Add signature section at the end
    rows.push([]);
    rows.push(["תאריך:", "", "", "", "", ""]);
    rows.push(["שם המשתמש:", "", "", "", "", ""]);
    rows.push(["חתימה:", "", "", "", "", ""]);
    
    // Convert rows to CSV
    const csvString = rows.map(row => row.join(",")).join("\n");
    
    // Create and trigger download
    const encodedUri = encodeURI(csvContent + csvString);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ספירת_מלאי_${format(new Date(), "dd_MM_yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div>
      <button onClick={downloadFormattedCSV} style={{ display: 'none' }} id="exportButton">
        ייצא לאקסל
      </button>
    </div>
  );
}