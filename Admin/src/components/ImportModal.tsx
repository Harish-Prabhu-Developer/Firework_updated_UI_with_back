import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Platform, Pressable } from "react-native";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Checkbox } from "./ui/Checkbox";
import { Dialog } from "./ui/Dialog";
import { Upload, Pencil, Trash2, Plus, Check, X, FileUp } from "lucide-react-native";
import { parseImportFile } from "../lib/exportUtils";
import { useResponsive } from "../hooks/use-responsive";
import { cn } from "../lib/utils";

import { pickImage } from "../lib/filePicker";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedColumns: { key: string; label: string }[];
  onImport: (data: Record<string, string>[]) => void;
  title?: string;
}

export function ImportModal({
  open,
  onOpenChange,
  expectedColumns,
  onImport,
  title = "Import Data"
}: ImportModalProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const { isMobile } = useResponsive();

  const handleFileChange = async (e: any) => {
    let file;
    if (Platform.OS === 'web') {
      file = e.target.files?.[0];
    } else {
      const uri = await pickImage();
      if (uri) file = { uri, name: 'imported_file.csv' };
    }

    if (!file) return;
    setFileName(file.name);
    try {
      const sheets = await parseImportFile(file);
      if (sheets.length > 0 && sheets[0].length > 0) {
        setRows(sheets[0]);
        setSelected(new Set());
      }
    } catch (err) {
      alert("Failed to parse file");
    }
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    expectedColumns.forEach(c => newRow[c.key] = "");
    setRows([newRow, ...rows]);
  };

  const deleteRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
    const nextSelected = new Set(selected);
    nextSelected.delete(idx);
    setSelected(nextSelected);
  };

  const startEdit = (idx: number) => {
    setEditingRow(idx);
    setEditForm(rows[idx]);
  };

  const saveEdit = () => {
    if (editingRow === null) return;
    const nextRows = [...rows];
    nextRows[editingRow] = editForm;
    setRows(nextRows);
    setEditingRow(null);
  };

  const handleImport = () => {
    const toImport = selected.size > 0 ? rows.filter((_, i) => selected.has(i)) : rows;
    if (toImport.length === 0) {
      alert("No records selected");
      return;
    }
    console.log("FINAL IMPORT DATA (JSON):", toImport);
    onImport(toImport);
    setRows([]);
    setFileName("");
    onOpenChange(false);
  };

  const displayColumns = expectedColumns.filter((c) => c.key !== "actions");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={isMobile ? "max-w-full" : "max-w-4xl"}
      footer={
        <View className="flex-row gap-2 justify-end">
          <Button variant="outline" label="Cancel" onPress={() => onOpenChange(false)} />
          {rows.length > 0 && (
            <Button label={`Import ${selected.size || rows.length} Records`} onPress={handleImport} variant="edit" />
          )}
        </View>
      }
    >
      <ScrollView className="max-h-[70vh]">
        {rows.length === 0 ? (
          <Pressable
            onPress={handleFileChange}
            className="border-2 border-dashed border-border rounded-xl p-10 items-center justify-center bg-muted/20"
          >
            <FileUp size={48} color="#64748b" />
            <Text className="text-foreground font-bold mt-4">Upload CSV Data</Text>
            <Text className="text-xs text-muted-foreground mt-1">Select a CSV to modify its contents</Text>
            {Platform.OS === 'web' && (
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            )}
          </Pressable>
        ) : (
          <View className="gap-4">
            <View className="flex-row items-center justify-between bg-muted/30 p-3 rounded-lg border border-border">
              <View>
                <Text className="text-xs font-bold text-foreground">📄 {fileName}</Text>
                <Text className="text-[10px] text-muted-foreground uppercase">{rows.length} Total Records Found</Text>
              </View>
              <View className="flex-row gap-2">
                <Button variant="outline" size="sm" label="Add Row" onPress={addRow}>
                  <Plus size={14} color="#6366f1" />
                </Button>
                <Button variant="outline" size="sm" label="Re-upload" onPress={handleFileChange}>
                  <FileUp size={14} color="#64748b" />
                </Button>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header */}
                <View className="flex-row bg-muted p-2 border-b border-border">
                  <View className="w-10 items-center justify-center">
                    <Checkbox checked={selected.size === rows.length} onCheckedChange={() => {
                      if (selected.size === rows.length) setSelected(new Set());
                      else setSelected(new Set(rows.map((_, i) => i)));
                    }} />
                  </View>
                  {displayColumns.map(col => (
                    <View key={col.key} className="w-32 px-2">
                      <Text className="text-[10px] font-bold text-muted-foreground uppercase">{col.label}</Text>
                    </View>
                  ))}
                  <View className="w-24 px-2">
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase">Actions</Text>
                  </View>
                </View>

                {/* Rows */}
                {rows.map((row, idx) => (
                  <View key={idx} className={cn("flex-row p-2 border-b border-border/50 items-center", selected.has(idx) && "bg-primary/5")}>
                    <View className="w-10 items-center justify-center">
                      <Checkbox checked={selected.has(idx)} onCheckedChange={() => {
                        const next = new Set(selected);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        setSelected(next);
                      }} />
                    </View>

                    {editingRow === idx ? (
                      <>
                        {displayColumns.map(col => (
                          <View key={col.key} className="w-32 px-1">
                            <Input
                              value={editForm[col.key] || ""}
                              onChangeText={(v) => setEditForm(prev => ({ ...prev, [col.key]: v }))}
                              className="h-8 text-xs"
                            />
                          </View>
                        ))}
                        <View className="w-24 px-2 flex-row gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onPress={saveEdit}>
                            <Check size={14} color="#10b981" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onPress={() => setEditingRow(null)}>
                            <X size={14} color="#ef4444" />
                          </Button>
                        </View>
                      </>
                    ) : (
                      <>
                        {displayColumns.map(col => (
                          <View key={col.key} className="w-32 px-2">
                            <Text className="text-xs text-foreground" numberOfLines={1}>{row[col.key] || "—"}</Text>
                          </View>
                        ))}
                        <View className="w-24 px-2 flex-row gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onPress={() => startEdit(idx)}>
                            <Pencil size={14} color="#6366f1" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onPress={() => deleteRow(idx)}>
                            <Trash2 size={14} color="#ef4444" />
                          </Button>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Dialog>
  );
}
