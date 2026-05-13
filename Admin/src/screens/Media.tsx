import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  Copy,
  Film,
  Flame,
  Flower2,
  LayoutGrid,
  Monitor,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { ImagePreviewModal } from '../components/modals/ImagePreviewModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { usePermissions } from '../hooks/usePermissions';
import { useResponsive } from '../hooks/useResponsive';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

const MODULE = 'Media Library';

type ViewMode = 'Hero' | 'Assets';
type BadgeIcon = 'sparkles' | 'zap' | 'flame' | 'flower2';

interface HeroSlide {
  id: string;
  title: string;
  badge: string;
  badgeIcon: BadgeIcon;
  description: string;
  cta: string;
  link: string;
  image: string;
  displayOrder: number;
  status: boolean;
}

interface AssetItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  createdAt: string;
}

interface HeroFormState {
  title: string;
  badge: string;
  badgeIcon: BadgeIcon;
  description: string;
  cta: string;
  link: string;
  image: string;
  displayOrder: number;
  status: boolean;
}

const INITIAL_HEROES: HeroSlide[] = [
  {
    id: 'hero-1',
    title: 'Festival Fireworks\nMega Showcase',
    badge: 'Festive Spotlight',
    badgeIcon: 'sparkles',
    description: 'Lead with your strongest seasonal story and keep the storefront feeling fresh every week.',
    cta: 'Shop Collection',
    link: '/products',
    image: 'https://picsum.photos/id/20/1920/900',
    displayOrder: 1,
    status: true,
  },
  {
    id: 'hero-2',
    title: 'Premium Crackers\nFor Grand Events',
    badge: 'Top Seller',
    badgeIcon: 'flame',
    description: 'Highlight high-conversion banners with bold messaging and a clean call to action.',
    cta: 'Explore Range',
    link: '/categories',
    image: 'https://picsum.photos/id/21/1920/900',
    displayOrder: 2,
    status: false,
  },
  {
    id: 'hero-3',
    title: 'Safe Celebration\nFamily Packs',
    badge: 'Family Choice',
    badgeIcon: 'flower2',
    description: 'Use supporting slides to balance premium launches with evergreen offers and bundles.',
    cta: 'View Packs',
    link: '/offers',
    image: 'https://picsum.photos/id/22/1920/900',
    displayOrder: 3,
    status: false,
  },
];

const INITIAL_ASSETS: AssetItem[] = [
  {
    id: 'asset-1',
    name: 'crackers-banner.jpg',
    url: 'https://picsum.photos/id/40/1200/900',
    type: 'image',
    size: 245000,
    createdAt: '2026-04-15',
  },
  {
    id: 'asset-2',
    name: 'sparklers-thumb.png',
    url: 'https://picsum.photos/id/41/1200/900',
    type: 'image',
    size: 182000,
    createdAt: '2026-04-18',
  },
  {
    id: 'asset-3',
    name: 'festival-promo.mp4',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'video',
    size: 5200000,
    createdAt: '2026-04-20',
  },
  {
    id: 'asset-4',
    name: 'night-display-cover.jpg',
    url: 'https://picsum.photos/id/42/1200/900',
    type: 'image',
    size: 301000,
    createdAt: '2026-04-24',
  },
];

const createDefaultHeroForm = (displayOrder: number): HeroFormState => ({
  title: '',
  badge: '',
  badgeIcon: 'sparkles',
  description: '',
  cta: '',
  link: '/products',
  image: 'https://picsum.photos/id/20/1920/900',
  displayOrder,
  status: true,
});

const getBadgeIcon = (name: BadgeIcon, size = 16, color = colors.primary) => {
  switch (name) {
    case 'zap':
      return <Zap size={size} color={color} />;
    case 'flame':
      return <Flame size={size} color={color} />;
    case 'flower2':
      return <Flower2 size={size} color={color} />;
    case 'sparkles':
    default:
      return <Sparkles size={size} color={color} />;
  }
};

// Slice-like hook for Media/Hero operations
export const useMediaQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const heroesQuery = useQuery<HeroSlide[]>({
    queryKey: ['heroes'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/banners');
        const raw = data.data ?? [];
        return raw.map((item: any) => ({
          id: item.id,
          title: item.title,
          badge: item.badge,
          badgeIcon: item.badgeIcon,
          description: item.desc || item.description || '',
          cta: item.cta,
          link: item.link,
          image: item.image,
          displayOrder: item.displayOrder,
          status: item.status,
        }));
      } catch {
        return INITIAL_HEROES;
      }
    },
    initialData: INITIAL_HEROES,
  });

  const assetsQuery = useQuery<AssetItem[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/uploads');
        const raw = data.data ?? [];
        return raw.map((item: any) => ({
          id: item.fileName,
          name: item.fileName,
          url: item.relativePath.startsWith('http') ? item.relativePath : `${api.defaults.baseURL?.replace('/api/v1', '')}${item.relativePath}`,
          type: item.assetType === 'videoFile' ? 'video' : 'image',
          size: item.size,
          createdAt: new Date(item.updatedAt).toLocaleDateString(),
        }));
      } catch {
        return INITIAL_ASSETS;
      }
    },
    initialData: INITIAL_ASSETS,
  });

  const saveHeroMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: HeroFormState }) => {
      const { description, ...rest } = payload;
      const mappedPayload = {
        ...rest,
        desc: description,
      };
      return id ? api.put(`/banners/${id}`, mappedPayload) : api.post('/banners', mappedPayload);
    },
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['heroes'] }); toast.success(variables.id ? 'Slide updated' : 'Slide created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteHeroMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['heroes'] }); toast.success('Slide deleted'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  return {
    heroes: heroesQuery.data || [],
    assets: assetsQuery.data || [],
    isLoading: heroesQuery.isLoading || assetsQuery.isLoading,
    saveHero: saveHeroMutation,
    removeHero: deleteHeroMutation,
    bulkRemoveHero: useMutation({
      mutationFn: (ids: string[]) => api.delete('/banners/bulk', { data: { ids } }),
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['heroes'] }); toast.success('Selected slides deleted'); },
      onError: (e) => toast.apiError(e, 'Failed'),
    }),
  };
};

export default function Media() {
  const { isMobile } = useResponsive();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const { heroes, assets, isLoading, saveHero, removeHero, bulkRemoveHero } = useMediaQueries();

  const canCreate = hasPermission(MODULE, 'Create');
  const canUpdate = hasPermission(MODULE, 'Update');
  const canDelete = hasPermission(MODULE, 'Delete');

  const [activeMode, setActiveMode] = useState<ViewMode>('Hero');
  const [heroSearch, setHeroSearch] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [deleteHeroId, setDeleteHeroId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editHeroId, setEditHeroId] = useState<string | null>(null);
  const [heroForm, setHeroForm] = useState<HeroFormState>(createDefaultHeroForm(heroes.length + 1));
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');

  const filteredHeroes = useMemo(() => {
    const query = heroSearch.trim().toLowerCase();
    if (!query) return heroes;
    return heroes.filter((hero) =>
      [hero.title, hero.badge, hero.description, hero.cta, hero.link].join(' ').toLowerCase().includes(query)
    );
  }, [heroSearch, heroes]);

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => asset.name.toLowerCase().includes(query));
  }, [assetSearch, assets]);

  const activeHero = heroes.find((hero) => hero.status) ?? heroes[0];

  const openAddHero = () => {
    if (!canCreate) {
      toast.warn('You do not have permission to create slides');
      return;
    }
    setEditHeroId(null);
    setHeroForm(createDefaultHeroForm(heroes.length + 1));
    setHeroFormOpen(true);
  };

  const openEditHero = (hero: HeroSlide) => {
    if (!canUpdate) {
      toast.warn('You do not have permission to edit slides');
      return;
    }
    setEditHeroId(hero.id);
    setHeroForm({
      title: hero.title,
      badge: hero.badge,
      badgeIcon: hero.badgeIcon,
      description: hero.description,
      cta: hero.cta,
      link: hero.link,
      image: hero.image,
      displayOrder: hero.displayOrder,
      status: hero.status,
    });
    setHeroFormOpen(true);
  };

  const handleHeroSubmit = () => {
    if (!heroForm.title.trim() || !heroForm.badge.trim() || !heroForm.image.trim()) {
      toast.error('Title, badge, and image are required');
      return;
    }
    saveHero.mutate({ id: editHeroId ?? undefined, payload: heroForm }, {
      onSuccess: () => { setHeroFormOpen(false); setEditHeroId(null); }
    });
  };

  const handleDeleteHero = () => {
    if (!deleteHeroId) return;
    removeHero.mutate(deleteHeroId, {
      onSuccess: () => setDeleteHeroId(null)
    });
  };

  const heroColumns: Column<HeroSlide>[] = [
    {
      key: 'preview',
      label: 'Visual',
      width: 120,
      render: (hero) => (
        <View className="h-12 w-20 rounded-lg overflow-hidden border border-border">
          <Image source={{ uri: hero.image }} className="w-full h-full" resizeMode="cover" />
        </View>
      ),
    },
    {
      key: 'title',
      label: 'Hero Title',
      width: 250,
      render: (hero) => (
        <View>
          <Text style={{ fontFamily: Fonts.body }} className="font-bold text-sm text-foreground" numberOfLines={1}>
            {hero.title.replace('\n', ' ')}
          </Text>
          <Text style={{ fontFamily: Fonts.body }} className="text-[10px] text-muted-foreground mt-1" numberOfLines={1}>
            {hero.description}
          </Text>
        </View>
      ),
    },
    {
      key: 'badge',
      label: 'Badge',
      width: 160,
      render: (hero) => (
        <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full self-start">
          {getBadgeIcon(hero.badgeIcon, 11, colors.primary)}
          <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-bold text-primary">{hero.badge}</Text>
        </View>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      width: 90,
      align: 'center',
      render: (hero) => <Text style={{ fontFamily: Fonts.body }} className="font-bold text-sm text-foreground">{hero.displayOrder}</Text>,
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      render: (hero) => <StatusBadge status={hero.status ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 110,
      render: (hero) => (
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => openEditHero(hero)}
            disabled={!canUpdate}
            className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"
            style={{ opacity: canUpdate ? 1 : 0.5 }}
          >
            <Pencil size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleteHeroId(hero.id)}
            disabled={!canDelete}
            className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"
            style={{ opacity: canDelete ? 1 : 0.5 }}
          >
            <Trash2 size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  return (
    <MasterScreenLayout
      title="Hero & Assets"
      subtitle="Manage storefront banners and media files"
      module={MODULE}
      scrollable={false}
      onAddNew={activeMode === 'Hero' ? openAddHero : undefined}
      addNewLabel="Add Slide"
      extraHeaderContent={
        <View className="flex-row bg-muted p-1 rounded-2xl border border-border/60">
          <TouchableOpacity
            className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${activeMode === 'Hero' ? 'bg-card shadow-sm shadow-primary/20' : ''}`}
            onPress={() => setActiveMode('Hero')}
          >
            <Monitor size={14} color={activeMode === 'Hero' ? colors.primary : colors.mutedForeground} />
            <Text style={{ fontFamily: Fonts.body }} className={`text-[10px] font-black uppercase ${activeMode === 'Hero' ? 'text-primary' : 'text-muted-foreground'}`}>
              Banners
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${activeMode === 'Assets' ? 'bg-card shadow-sm shadow-primary/20' : ''}`}
            onPress={() => setActiveMode('Assets')}
          >
            <LayoutGrid size={14} color={activeMode === 'Assets' ? colors.primary : colors.mutedForeground} />
            <Text style={{ fontFamily: Fonts.body }} className={`text-[10px] font-black uppercase ${activeMode === 'Assets' ? 'text-primary' : 'text-muted-foreground'}`}>
              Assets
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      {activeMode === 'Hero' ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => {
              if (activeHero) {
                setPreviewUri(activeHero.image);
                setPreviewName(activeHero.title);
                setPreviewType('image');
              }
            }}
          >
            <Card style={{ borderRadius: Radius['3xl'] }} className="mb-6 overflow-hidden border-0">
              <View className="absolute inset-0 bg-black/35 z-10" />
              <Image
                source={{ uri: activeHero?.image ?? 'https://picsum.photos/id/20/1920/900' }}
                className="w-full h-[280px]"
                resizeMode="cover"
              />
              <View className="absolute inset-0 z-20 p-6 justify-center">
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="h-8 w-8 rounded-full bg-white/20 items-center justify-center">
                    {activeHero ? getBadgeIcon(activeHero.badgeIcon, 16, '#ffffff') : null}
                  </View>
                  <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-black text-white bg-white/15 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {activeHero?.badge ?? 'No Active Slide'}
                  </Text>
                </View>
                <Text style={{ fontFamily: Fonts.display }} className="text-3xl font-black text-white leading-tight mb-3">
                  {activeHero?.title ?? 'Media Manager'}
                </Text>
                <Text style={{ fontFamily: Fonts.body }} className="text-sm text-white/80 leading-relaxed mb-6 max-w-[85%]">
                  {activeHero?.description ?? 'Use the slide inventory below to keep the storefront visuals fresh and consistent.'}
                </Text>
                <View style={{ borderRadius: Radius.full }} className="self-start bg-white px-6 py-3">
                  <Text style={{ fontFamily: Fonts.body }} className="text-xs font-black text-primary uppercase tracking-widest">
                    {activeHero?.cta ?? 'Learn More'}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          <AdaptiveTable
            data={filteredHeroes}
            columns={heroColumns}
            loading={isLoading}
            emptyText="No slides match your search"
            searchValue={heroSearch}
            onSearchChange={setHeroSearch}
            selectedIds={selectedIds}
            onSelectAll={(all) =>
              setSelectedIds(all ? new Set(filteredHeroes.map((hero) => hero.id)) : new Set<string>())
            }
            onSelectRow={(id) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              })
            }
            onBulkDelete={
              canDelete && selectedIds.size > 0
                ? () => setBulkDeleteOpen(true)
                : undefined
            }
            exportTitle="Hero Slides"
            exportFilename="hero-slides"
            renderCard={(hero) => (
              <View style={globalStyles.card}>
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="h-16 w-24 rounded-2xl overflow-hidden border border-border">
                    <Image source={{ uri: hero.image }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text style={{ fontFamily: Fonts.body }} className="font-black text-foreground flex-1" numberOfLines={1}>
                        {hero.title.replace('\n', ' ')}
                      </Text>
                      <StatusBadge status={hero.status ? 'Active' : 'Inactive'} />
                    </View>
                    <Text style={{ fontFamily: Fonts.body }} className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                      {hero.description}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between bg-primary/5 px-3 py-2 rounded-xl">
                  <View className="flex-row items-center gap-2">
                    {getBadgeIcon(hero.badgeIcon, 12, colors.primary)}
                    <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-bold text-primary uppercase">{hero.badge}</Text>
                  </View>
                  <Text style={{ fontFamily: Fonts.body }} className="text-[10px] font-bold text-muted-foreground uppercase">Order #{hero.displayOrder}</Text>
                </View>
                <View className="flex-row border-t border-border/40 mt-4 pt-4 gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onPress={() => openEditHero(hero)} disabled={!canUpdate}>
                    <Pencil size={14} color={colors.primary} />
                    <Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-primary">Edit</Text>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onPress={() => setDeleteHeroId(hero.id)} disabled={!canDelete}>
                    <Trash2 size={14} color={colors.destructive} />
                    <Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-destructive">Delete</Text>
                  </Button>
                </View>
              </View>
            )}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center gap-3 mb-5">
            <View className="flex-1">
              <Input
                value={assetSearch}
                onChangeText={setAssetSearch}
                placeholder="Search media files"
              />
            </View>
            <Button
              size="md"
              className="px-4"
              onPress={() => toast.info('Upload flow is ready to be wired to your storage API')}
            >
              <Upload size={14} color={colors.primaryForeground} />
              <Text style={{ fontFamily: Fonts.body }} className="text-white font-bold text-xs uppercase ml-1">Upload</Text>
            </Button>
          </View>

          <FlatList
            data={filteredAssets}
            keyExtractor={(item) => item.id}
            numColumns={isMobile ? 2 : 4}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <View className="py-16 items-center">
                <Text style={{ fontFamily: Fonts.body }} className="text-sm text-muted-foreground">No assets match your search</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.8}
                style={{ width: isMobile ? '50%' : '25%' }} 
                className="p-2"
                onPress={() => {
                  setPreviewUri(item.url);
                  setPreviewName(item.name);
                  setPreviewType(item.type);
                }}
              >
                <Card style={{ borderRadius: Radius.xl }} className="overflow-hidden border border-border bg-card">
                  <View className="aspect-square bg-muted items-center justify-center">
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Film size={32} color={colors.mutedForeground} />
                    )}
                    <View className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded-full">
                      <Text style={{ fontFamily: Fonts.body }} className="text-[8px] font-black text-white uppercase">{item.type}</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text style={{ fontFamily: Fonts.body }} className="text-xs font-black text-foreground mb-1" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontFamily: Fonts.body }} className="text-[10px] text-muted-foreground mb-3">
                      {(item.size / 1024).toFixed(0)} KB • {item.createdAt}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <StatusBadge status={item.type === 'image' ? 'Active' : 'pending'} />
                      <TouchableOpacity onPress={() => toast.info(`Asset URL: ${item.url}`)}>
                        <Copy size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FormModal
        open={heroFormOpen}
        onClose={() => setHeroFormOpen(false)}
        title={editHeroId ? 'Edit Hero Slide' : 'Add Hero Slide'}
        footer={
          <View className="flex-row gap-3">
            <Button variant="outline" label="Cancel" className="flex-1" onPress={() => setHeroFormOpen(false)} />
            <Button
              label={editHeroId ? 'Update Slide' : 'Create Slide'}
              className="flex-1"
              onPress={handleHeroSubmit}
              loading={saveHero.isPending}
            />
          </View>
        }
      >
        <View className="gap-4">
          <View style={{ borderRadius: Radius.xl }} className="w-full aspect-[2/1] overflow-hidden border border-border bg-muted">
            <Image source={{ uri: heroForm.image }} className="w-full h-full" resizeMode="cover" />
          </View>

          <Input
            label="Banner Image URL"
            value={heroForm.image}
            onChangeText={(value) => setHeroForm((prev) => ({ ...prev, image: value }))}
            placeholder="https://example.com/banner.jpg"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Select
                label="Accent Icon"
                value={heroForm.badgeIcon}
                onValueChange={(value) => setHeroForm((prev) => ({ ...prev, badgeIcon: value as BadgeIcon }))}
                options={[
                  { label: 'Sparkles', value: 'sparkles' },
                  { label: 'Zap', value: 'zap' },
                  { label: 'Flame', value: 'flame' },
                  { label: 'Flower', value: 'flower2' },
                ]}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Display Order"
                value={String(heroForm.displayOrder)}
                onChangeText={(value) =>
                  setHeroForm((prev) => ({
                    ...prev,
                    displayOrder: Number(value) || 1,
                  }))
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Badge Text"
            value={heroForm.badge}
            onChangeText={(value) => setHeroForm((prev) => ({ ...prev, badge: value }))}
            placeholder="Festive Spotlight"
          />

          <Input
            label="Headline"
            value={heroForm.title}
            onChangeText={(value) => setHeroForm((prev) => ({ ...prev, title: value }))}
            placeholder={"Grand Festive\nMega Sale"}
          />

          <Input
            label="Description"
            value={heroForm.description}
            onChangeText={(value) => setHeroForm((prev) => ({ ...prev, description: value }))}
            placeholder="Tell the shopper why this slide matters."
            multiline
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="CTA Label"
                value={heroForm.cta}
                onChangeText={(value) => setHeroForm((prev) => ({ ...prev, cta: value }))}
                placeholder="Shop Now"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Redirect Link"
                value={heroForm.link}
                onChangeText={(value) => setHeroForm((prev) => ({ ...prev, link: value }))}
                placeholder="/products"
              />
            </View>
          </View>

          <TouchableOpacity
            style={{ borderRadius: Radius.xl }}
            className={`h-11 items-center justify-center border ${heroForm.status ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'}`}
            onPress={() => setHeroForm((prev) => ({ ...prev, status: !prev.status }))}
          >
            <Text style={{ fontFamily: Fonts.body }} className={`text-xs font-bold uppercase ${heroForm.status ? 'text-primary' : 'text-muted-foreground'}`}>
              {heroForm.status ? 'Live on storefront' : 'Hidden from storefront'}
            </Text>
          </TouchableOpacity>
        </View>
      </FormModal>

      <DeleteConfirmModal
        open={!!deleteHeroId}
        onOpenChange={(open) => {
          if (!open) setDeleteHeroId(null);
        }}
        itemName="slide"
        onConfirm={handleDeleteHero}
        loading={removeHero.isPending}
      />

      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedIds.size}
        itemName="slide"
        onConfirm={() => bulkRemoveHero.mutate([...selectedIds], {
          onSuccess: () => {
            setSelectedIds(new Set());
            setBulkDeleteOpen(false);
          }
        })}
        loading={bulkRemoveHero.isPending}
      />

      <ImagePreviewModal
        open={!!previewUri}
        uri={previewUri}
        name={previewName}
        type={previewType}
        onClose={() => setPreviewUri(null)}
      />
    </MasterScreenLayout>
  );
}
