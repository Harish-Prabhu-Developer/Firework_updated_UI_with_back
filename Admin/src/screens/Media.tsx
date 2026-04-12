import React, { useState } from "react";
import { View, Text, Image, FlatList, Pressable, ScrollView, TextInput, Platform } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Copy, Trash2, Search, Image as ImageIcon, Film, Eye, Upload } from "lucide-react-native";
import { useResponsive } from "../hooks/use-responsive";
import { cn } from "../lib/utils";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  size: number;
  usedIn: string;
  createdAt: string;
}

const initialMedia: MediaItem[] = [
  { id: "1", name: "crackers-banner.jpg", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400", type: "image", size: 245000, usedIn: "Category: Crackers", createdAt: "2024-12-15" },
  { id: "2", name: "sparklers-thumb.png", url: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400", type: "image", size: 182000, usedIn: "Product: Sparkler Pack", createdAt: "2024-12-18" },
  { id: "3", name: "diwali-promo.mp4", url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", size: 5200000, usedIn: "Video: Diwali Collection", createdAt: "2024-12-20" },
  { id: "4", name: "flower-pot.jpg", url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400", type: "image", size: 310000, usedIn: "Product: Flower Pots", createdAt: "2024-12-22" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function Media() {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState("");
  const { isMobile, width } = useResponsive();
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const filtered = media.filter((m) => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.usedIn.toLowerCase().includes(search.toLowerCase())
  );

  const numColumns = isMobile ? 2 : Math.floor(width / 220);
  const totalSize = media.reduce((sum, m) => sum + m.size, 0);

  const copyLink = (url: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    } else {
      alert("URL: " + url);
    }
  };

  const deleteItem = (id: string) => {
    setMedia(media.filter((m) => m.id !== id));
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <View style={{ width: `${100 / numColumns}%` }} className="p-2">
      <Card className="overflow-hidden">
        <Pressable 
          onPress={() => setPreviewItem(item)}
          className="aspect-square bg-muted items-center justify-center relative"
        >
          {item.type === "image" ? (
            <Image source={{ uri: item.url }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Film size={32} color="#64748b" />
          )}
          <View className="absolute top-1 right-1 px-1 rounded bg-black/50">
            <Text className="text-[8px] text-white font-bold uppercase">{item.type}</Text>
          </View>
          <View className="absolute inset-0 bg-black/20 opacity-0 active:opacity-100 items-center justify-center">
            <Eye size={24} color="white" />
          </View>
        </Pressable>
        <View className="p-2">
          <Text className="text-xs font-bold text-foreground" numberOfLines={1}>{item.name}</Text>
          <View className="flex-row justify-between mt-1">
             <Text className="text-[9px] text-muted-foreground">{formatSize(item.size)}</Text>
             <Text className="text-[9px] text-muted-foreground">{item.createdAt}</Text>
          </View>
          <View className="flex-row gap-1 mt-2">
            <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-7 rounded-md" 
                onPress={() => copyLink(item.url)}
            >
                <View className="flex-row items-center gap-1">
                    <Copy size={10} color="#1e293b" />
                    <Text className="text-[10px] font-bold">Copy</Text>
                </View>
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                className="w-7 h-7 rounded-md p-0"
                onPress={() => deleteItem(item.id)}
            >
                <Trash2 size={10} color="#ef4444" />
            </Button>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 md:p-6 pb-2">
        <View className="flex-row items-center justify-between gap-4 mb-4">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-foreground">Media Library</Text>
              <View className="bg-muted px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold">{media.length} files</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground mt-0.5">{formatSize(totalSize)} Total Storage</Text>
          </View>
          <Button size="sm" className="gap-1.5 rounded-lg px-4 h-10">
             <Upload size={16} color="white" />
             <Text className="text-primary-foreground font-bold">Upload</Text>
          </Button>
        </View>

        <View className="relative">
           <View className="absolute left-3 top-3 z-10">
             <Search size={16} color="#64748b" />
           </View>
           <TextInput 
             className="bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground"
             placeholder="Search media..."
             placeholderTextColor="#94a3b8"
             value={search}
             onChangeText={setSearch}
           />
        </View>
      </View>

      <FlatList 
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <ImageIcon size={48} color="#cbd5e1" />
            <Text className="text-muted-foreground mt-2">No media found</Text>
          </View>
        }
      />

      <Dialog 
        open={!!previewItem} 
        onOpenChange={() => setPreviewItem(null)}
        title={previewItem?.name || ""}
        footer={<Button label="Copy Link" onPress={() => previewItem && copyLink(previewItem.url)} className="w-full" />}
      >
        <View className="items-center pb-6">
           {previewItem?.type === "image" ? (
             <Image source={{ uri: previewItem.url }} className="w-full h-64 rounded-xl" resizeMode="contain" />
           ) : (
             <View className="w-full h-64 bg-muted rounded-xl items-center justify-center">
               <Film size={64} color="#64748b" />
               <Text className="text-muted-foreground mt-2">Video Preview</Text>
             </View>
           )}
           <View className="w-full mt-4 bg-muted/50 p-3 rounded-lg flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Size: {previewItem && formatSize(previewItem.size)}</Text>
              <Text className="text-xs text-muted-foreground">Created: {previewItem?.createdAt}</Text>
           </View>
        </View>
      </Dialog>
    </View>
  );
}
