import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react-native";
import { exportToCsv, exportToExcel, exportToPdf } from "../lib/exportUtils";

interface ExportColumn {
  key: string;
  label: string;
}

interface ExportDropdownProps<T> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
}

export function ExportDropdown<T>({ data, columns, filename, title }: ExportDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const exportCols = columns.filter((c) => c.key !== "actions" && c.key !== "image" && c.key !== "thumbnail");

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    if (data.length === 0) { alert("No data to export"); return; }
    try {
      if (format === "csv") exportToCsv(data, exportCols, filename);
      else if (format === "excel") exportToExcel(data, exportCols, filename);
      else exportToPdf(data, exportCols, filename, title);
      setOpen(false);
    } catch {
      alert("Export failed");
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1.5 h-10 px-4 rounded-lg"
        onPress={() => setOpen(true)}
      >
        <View className="flex-row items-center gap-2">
            <Download size={16} color="#64748b" />
            <Text className="text-foreground font-bold">Export</Text>
        </View>
      </Button>

      <Dialog 
        open={open} 
        onOpenChange={setOpen} 
        title="Export Data"
      >
        <View className="gap-3 pb-6">
          <Pressable 
            onPress={() => handleExport("pdf")}
            className="flex-row items-center p-4 bg-muted/20 rounded-xl active:bg-muted/50"
          >
            <View className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mr-3">
               <FileText size={20} color="#ef4444" />
            </View>
            <Text className="text-foreground font-medium">Export as PDF</Text>
          </Pressable>

          <Pressable 
            onPress={() => handleExport("csv")}
            className="flex-row items-center p-4 bg-muted/20 rounded-xl active:bg-muted/50"
          >
            <View className="h-10 w-10 rounded-full bg-green-100 items-center justify-center mr-3">
               <File size={20} color="#22c55e" />
            </View>
            <Text className="text-foreground font-medium">Export as CSV</Text>
          </Pressable>

          <Pressable 
            onPress={() => handleExport("excel")}
            className="flex-row items-center p-4 bg-muted/20 rounded-xl active:bg-muted/50"
          >
            <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
               <FileSpreadsheet size={20} color="#3b82f6" />
            </View>
            <Text className="text-foreground font-medium">Export as Excel</Text>
          </Pressable>
        </View>
      </Dialog>
    </>
  );
}
