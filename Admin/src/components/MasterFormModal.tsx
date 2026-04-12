import React, { useState, useEffect } from "react";
import { View, Text, Image } from "react-native";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Dialog } from "./ui/Dialog";

export interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "email" | "tel" | "image";
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
}

interface MasterFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FormField[];
  initialData?: Record<string, string>;
  onSubmit: (data: Record<string, string>) => void;
}

export function MasterFormModal({ 
  open, 
  onOpenChange, 
  title, 
  fields, 
  initialData, 
  onSubmit 
}: MasterFormModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setForm(initialData || {});
  }, [open, initialData]);

  const handleSubmit = () => {
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange} 
      title={title}
      footer={
        <>
          <Button variant="outline" label="Cancel" onPress={() => onOpenChange(false)} />
          <Button label="Save" onPress={handleSubmit} />
        </>
      }
    >
      <View className="gap-4 pb-10">
        {fields.map((f) => (
          <View key={f.key} className="gap-1.5">
            <Text className="text-sm font-medium text-foreground ml-1">
                {f.label}{f.required && <Text className="text-destructive"> *</Text>}
            </Text>
            
            {f.type === "textarea" ? (
              <Textarea 
                value={form[f.key] || ""} 
                onChangeText={(v) => setForm({ ...form, [f.key]: v })} 
                placeholder={f.placeholder} 
              />
            ) : f.type === "image" ? (
              <View className="flex-row items-center gap-3">
                {form[f.key] ? (
                   <Image source={{ uri: form[f.key] }} className="h-12 w-12 rounded-md border border-border" />
                ) : (
                   <View className="h-12 w-12 rounded-md bg-muted border border-border items-center justify-center">
                       <Text className="text-[8px] text-muted-foreground">No Img</Text>
                   </View>
                )}
                <View className="flex-1">
                  <Input 
                    value={form[f.key] || ""} 
                    onChangeText={(v) => setForm({ ...form, [f.key]: v })} 
                    placeholder="Image URL" 
                  />
                </View>
              </View>
            ) : f.type === "select" ? (
                // Simplified select (Input for now, as proper native select is platform-dependent)
                <Input 
                    value={form[f.key] || ""} 
                    onChangeText={(v) => setForm({ ...form, [f.key]: v })} 
                    placeholder={f.placeholder || `Enter ${f.label}`} 
                />
            ) : (
              <Input 
                value={form[f.key] || ""} 
                onChangeText={(v) => setForm({ ...form, [f.key]: v })} 
                placeholder={f.placeholder} 
                keyboardType={
                    f.type === "number" ? "numeric" : 
                    f.type === "email" ? "email-address" : 
                    f.type === "tel" ? "phone-pad" : "default"
                }
              />
            )}
          </View>
        ))}
      </View>
    </Dialog>
  );
}
