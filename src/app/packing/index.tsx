import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FolderPlus, Package } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddCategorySheet } from "@/components/packing/add-category-sheet";
import { AddItemSheet } from "@/components/packing/add-item-sheet";
import { CategoryAccordion } from "@/components/packing/category-section";
import { EditCategorySheet } from "@/components/packing/edit-category-sheet";
import { ItemDetailSheet } from "@/components/packing/item-detail-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Snackbar } from "@/components/ui/snackbar";
import { Text } from "@/components/ui/text";
import { listProgress, sortCategories, sortItems } from "@/lib/packing/utils";
import { TOP_OVERLAY_PORTAL_HOST } from "@/lib/portal-hosts";
import {
  deletePackingCategory,
  deletePackingItem,
  ensurePackingListForTrip,
  insertPackingCategory,
  insertPackingItem,
  updatePackingCategory,
  updatePackingItem,
} from "@/lib/services/packing";
import { useAuthStore } from "@/lib/stores/auth-store";
import type {
  PackingCategoryWithItems,
  PackingItemRow,
  PackingListWithCategories,
} from "@/lib/types/packing";
import { cn } from "@/lib/utils";

const UNDO_DELAY_MS = 5000;

type PendingItemDelete = {
  item: PackingItemRow;
  categoryId: string;
};

function showPersistError(message: string) {
  Alert.alert("Could not save", message);
}

export default function PackingManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tripId: tripIdParam } = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof tripIdParam === "string" ? tripIdParam : undefined;
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const userId = user?.id ?? null;

  const [list, setList] = useState<PackingListWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const categories = useMemo(
    () => sortCategories(list?.packing_categories ?? []),
    [list?.packing_categories]
  );
  const { packed, total, percent } = useMemo(() => listProgress(categories), [categories]);
  const defaultOpenIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const [selectedItem, setSelectedItem] = useState<PackingItemRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PackingCategoryWithItems | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemCategoryId, setAddItemCategoryId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<PackingCategoryWithItems | null>(null);
  const [undoSnackbar, setUndoSnackbar] = useState<{ message: string } | null>(null);
  const pendingDeleteRef = useRef<PendingItemDelete | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadList = useCallback(async () => {
    if (!tripId || !userId) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    const { data, error } = await ensurePackingListForTrip(tripId, userId);
    if (error) {
      setLoadError(error.message);
      setList(null);
      return;
    }
    setList(data);
  }, [tripId, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!tripId || !userId) {
        setLoading(false);
        return;
      }
      let cancelled = false;
      (async () => {
        setLoading(true);
        setLoadError(null);
        const { data, error } = await ensurePackingListForTrip(tripId, userId);
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setLoadError(error.message);
          setList(null);
          return;
        }
        setList(data);
      })();
      return () => {
        cancelled = true;
      };
    }, [tripId, userId])
  );

  const updateCategories = useCallback(
    (updater: (prev: PackingCategoryWithItems[]) => PackingCategoryWithItems[]) => {
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          packing_categories: updater(prev.packing_categories),
        };
      });
    },
    []
  );

  const findItem = useCallback(
    (itemId: string): PackingItemRow | undefined => {
      for (const cat of list?.packing_categories ?? []) {
        const item = cat.packing_items.find((i) => i.id === itemId);
        if (item) return item;
      }
      return undefined;
    },
    [list?.packing_categories]
  );

  const findCategoryNameForItem = useCallback(
    (itemId: string): string => {
      for (const cat of list?.packing_categories ?? []) {
        if (cat.packing_items.some((i) => i.id === itemId)) {
          return cat.name;
        }
      }
      return "";
    },
    [list?.packing_categories]
  );

  const findCategoryIdForItem = useCallback(
    (itemId: string): string | undefined => {
      for (const cat of list?.packing_categories ?? []) {
        if (cat.packing_items.some((i) => i.id === itemId)) {
          return cat.id;
        }
      }
      return undefined;
    },
    [list?.packing_categories]
  );

  const clearUndoTimeout = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  const restorePendingItem = useCallback(
    (pending: PendingItemDelete) => {
      updateCategories((cats) =>
        cats.map((cat) =>
          cat.id === pending.categoryId
            ? {
                ...cat,
                packing_items: sortItems([...cat.packing_items, pending.item]),
              }
            : cat
        )
      );
    },
    [updateCategories]
  );

  const flushPendingDelete = useCallback(() => {
    clearUndoTimeout();
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    pendingDeleteRef.current = null;

    void (async () => {
      const { error } = await deletePackingItem(pending.item.id);
      if (error) {
        restorePendingItem(pending);
        showPersistError(error.message);
      }
    })();
  }, [clearUndoTimeout, restorePendingItem]);

  const schedulePendingDeleteCommit = useCallback(() => {
    clearUndoTimeout();
    undoTimeoutRef.current = setTimeout(() => {
      setUndoSnackbar(null);
      flushPendingDelete();
    }, UNDO_DELAY_MS);
  }, [clearUndoTimeout, flushPendingDelete]);

  useEffect(() => {
    return () => {
      clearUndoTimeout();
      const pending = pendingDeleteRef.current;
      if (pending) {
        pendingDeleteRef.current = null;
        void deletePackingItem(pending.item.id);
      }
    };
  }, [clearUndoTimeout]);

  const handleUndoDelete = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    clearUndoTimeout();
    pendingDeleteRef.current = null;
    setUndoSnackbar(null);
    restorePendingItem(pending);

    if (selectedItem?.id === pending.item.id) {
      setSelectedItem(pending.item);
    }
  }, [clearUndoTimeout, restorePendingItem, selectedItem?.id]);

  const handleTogglePacked = useCallback(
    (itemId: string, packed: boolean) => {
      const previous = findItem(itemId);
      updateCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          packing_items: cat.packing_items.map((item) =>
            item.id === itemId ? { ...item, is_packed: packed } : item
          ),
        }))
      );
      setSelectedItem((prev) =>
        prev?.id === itemId ? { ...prev, is_packed: packed } : prev
      );
      void (async () => {
        const { error } = await updatePackingItem(itemId, { is_packed: packed });
        if (error) {
          if (previous) {
            updateCategories((cats) =>
              cats.map((cat) => ({
                ...cat,
                packing_items: cat.packing_items.map((item) =>
                  item.id === itemId ? { ...item, is_packed: previous.is_packed } : item
                ),
              }))
            );
            setSelectedItem((prev) =>
              prev?.id === itemId ? { ...prev, is_packed: previous.is_packed } : prev
            );
          }
          showPersistError(error.message);
        }
      })();
    },
    [findItem, updateCategories]
  );

  const handleItemPress = useCallback((item: PackingItemRow) => {
    setSelectedItem(item);
    setDetailOpen(true);
  }, []);

  const handleUpdateItem = useCallback(
    (updates: Partial<Pick<PackingItemRow, "name" | "quantity" | "notes" | "is_packed">>) => {
      if (!selectedItem) return;
      const itemId = selectedItem.id;
      const previous = findItem(itemId);
      if (!previous) return;

      updateCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          packing_items: cat.packing_items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }))
      );
      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : prev));

      void (async () => {
        const { error } = await updatePackingItem(itemId, updates);
        if (error) {
          updateCategories((cats) =>
            cats.map((cat) => ({
              ...cat,
              packing_items: cat.packing_items.map((item) =>
                item.id === itemId ? previous : item
              ),
            }))
          );
          setSelectedItem(previous);
          showPersistError(error.message);
        }
      })();
    },
    [findItem, selectedItem, updateCategories]
  );

  const requestDeleteItem = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      const item = findItem(itemId);
      const categoryId = findCategoryIdForItem(itemId);
      if (!item || !categoryId) return;

      flushPendingDelete();

      updateCategories((cats) =>
        cats.map((cat) => ({
          ...cat,
          packing_items: cat.packing_items.filter((i) => i.id !== itemId),
        }))
      );

      if (selectedItem?.id === itemId) {
        setDeleteDialogOpen(false);
        setDetailOpen(false);
        setSelectedItem(null);
      }

      pendingDeleteRef.current = { item, categoryId };
      setUndoSnackbar({ message: `"${item.name}" removed` });
      schedulePendingDeleteCommit();
    },
    [
      findCategoryIdForItem,
      findItem,
      flushPendingDelete,
      schedulePendingDeleteCommit,
      selectedItem?.id,
      updateCategories,
    ]
  );

  const runDeleteItem = useCallback(() => {
    if (!selectedItem) return;
    handleDeleteItem(selectedItem.id);
  }, [handleDeleteItem, selectedItem]);

  const handleAddCategory = useCallback(
    (name: string) => {
      if (!list) return;
      const sortOrder = list.packing_categories.length;
      void (async () => {
        const { data, error } = await insertPackingCategory(list.id, name, sortOrder);
        if (error || !data) {
          showPersistError(error?.message ?? "Could not add category.");
          return;
        }
        updateCategories((cats) => [...cats, data]);
      })();
    },
    [list, updateCategories]
  );

  const requestRenameCategory = useCallback((category: PackingCategoryWithItems) => {
    setEditingCategory(category);
    setEditCategoryOpen(true);
  }, []);

  const handleRenameCategory = useCallback(
    (name: string) => {
      if (!editingCategory) return;
      const categoryId = editingCategory.id;
      const previousName = editingCategory.name;

      updateCategories((cats) =>
        cats.map((c) => (c.id === categoryId ? { ...c, name } : c))
      );
      setEditingCategory((prev) => (prev ? { ...prev, name } : prev));

      void (async () => {
        const { error } = await updatePackingCategory(categoryId, { name });
        if (error) {
          updateCategories((cats) =>
            cats.map((c) => (c.id === categoryId ? { ...c, name: previousName } : c))
          );
          setEditingCategory((prev) => (prev ? { ...prev, name: previousName } : prev));
          showPersistError(error.message);
        }
      })();
    },
    [editingCategory, updateCategories]
  );

  const requestDeleteCategory = useCallback((category: PackingCategoryWithItems) => {
    setDeletingCategory(category);
    setDeleteCategoryDialogOpen(true);
  }, []);

  const runDeleteCategory = useCallback(() => {
    if (!deletingCategory) return;
    const categoryId = deletingCategory.id;
    const previousCategories = list?.packing_categories;

    updateCategories((cats) => cats.filter((c) => c.id !== categoryId));
    setDeleteCategoryDialogOpen(false);
    setDeletingCategory(null);

    void (async () => {
      const { error } = await deletePackingCategory(categoryId);
      if (error) {
        if (previousCategories) {
          setList((prev) => (prev ? { ...prev, packing_categories: previousCategories } : prev));
        }
        showPersistError(error.message);
      }
    })();
  }, [deletingCategory, list?.packing_categories, updateCategories]);

  const handleAddItem = useCallback(
    (categoryId: string, name: string) => {
      const category = list?.packing_categories.find((c) => c.id === categoryId);
      if (!category) return;
      const sortOrder = category.packing_items.length;
      void (async () => {
        const { data, error } = await insertPackingItem(categoryId, name, sortOrder);
        if (error || !data) {
          showPersistError(error?.message ?? "Could not add item.");
          return;
        }
        updateCategories((cats) =>
          cats.map((cat) =>
            cat.id === categoryId
              ? { ...cat, packing_items: [...cat.packing_items, data] }
              : cat
          )
        );
      })();
    },
    [list?.packing_categories, updateCategories]
  );

  const openAddItem = useCallback((categoryId: string | null) => {
    setAddItemCategoryId(categoryId);
    setAddItemOpen(true);
  }, []);

  const liveSelectedItem = selectedItem
    ? findItem(selectedItem.id) ?? selectedItem
    : null;

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated || !userId) {
    return <Redirect href="/" />;
  }

  if (!tripId) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base font-semibold">No trip selected</Text>
        <Text variant="muted" className="mt-2 text-center text-sm">
          Open a packing list from a trip on the home screen.
        </Text>
        <Button className="mt-6 rounded-xl" onPress={() => router.back()}>
          <Text>Go back</Text>
        </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text variant="muted" className="mt-3 text-sm">
          Loading packing list…
        </Text>
      </View>
    );
  }

  if (loadError || !list) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base font-semibold">
          Could not load packing list
        </Text>
        <Text variant="muted" className="mt-2 text-center text-sm">
          {loadError ?? "Something went wrong."}
        </Text>
        <Button className="mt-6 rounded-xl" onPress={() => void loadList()}>
          <Text>Try again</Text>
        </Button>
        <Button variant="ghost" className="mt-2 rounded-xl" onPress={() => router.back()}>
          <Text>Go back</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="border-border/60 border-b px-5 pb-4"
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="border-border/80 bg-card size-10 items-center justify-center rounded-full border active:opacity-80"
          >
            <Icon as={ArrowLeft} size={20} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text variant="h3" className="truncate tracking-tight">
              {list.name}
            </Text>
          </View>
        </View>

        <View className="bg-card border-border/70 mt-4 rounded-2xl border p-4 shadow-sm shadow-black/5">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
              <View className="bg-primary/10 size-9 items-center justify-center rounded-lg">
                <Icon as={Package} size={18} className="text-primary" />
              </View>
              <View>
                <Text className="text-sm font-semibold">Overall progress</Text>
                <Text variant="muted" className="text-xs tabular-nums">
                  {packed} of {total} items packed
                </Text>
              </View>
            </View>
            <Text className="text-primary text-lg font-bold tabular-nums">
              {percent}%
            </Text>
          </View>
          <Progress
            value={percent}
            className="mt-3 h-2"
            indicatorClassName="bg-primary"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CategoryAccordion
          categories={categories}
          defaultOpenIds={defaultOpenIds}
          onToggleItemPacked={handleTogglePacked}
          onItemPress={handleItemPress}
          onAddItem={(categoryId) => openAddItem(categoryId)}
          onRenameCategory={requestRenameCategory}
          onDeleteCategory={requestDeleteCategory}
          onDeleteItem={handleDeleteItem}
        />
      </ScrollView>

      <View
        className="border-border/60 absolute left-0 right-0 flex-row gap-3 border-t bg-background/95 px-5 pt-3"
        style={{ bottom: 0, paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={() => setAddCategoryOpen(true)}
          className="border-border bg-card flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 active:bg-accent"
          accessibilityRole="button"
          accessibilityLabel="Add category"
        >
          <Icon as={FolderPlus} size={18} className="text-foreground" />
          <Text className="text-sm font-semibold">Category</Text>
        </Pressable>
        <Pressable
          onPress={() => openAddItem(categories[0]?.id ?? null)}
          className="bg-primary flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 active:bg-primary/90"
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Icon as={Package} size={18} className="text-primary-foreground" />
          <Text className="text-primary-foreground text-sm font-semibold">
            Item
          </Text>
        </Pressable>
      </View>

      <ItemDetailSheet
        item={liveSelectedItem}
        categoryName={
          selectedItem ? findCategoryNameForItem(selectedItem.id) : ""
        }
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdateItem}
        onDelete={requestDeleteItem}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          portalHost={TOP_OVERLAY_PORTAL_HOST}
          className="rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem
                ? `Remove "${selectedItem.name}" from your packing list? You can undo for a few seconds afterward.`
                : "Remove this item from your packing list? You can undo for a few seconds afterward."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl")}
              onPress={runDeleteItem}
            >
              <Text>Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddCategorySheet
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onAdd={handleAddCategory}
      />

      <EditCategorySheet
        open={editCategoryOpen}
        onOpenChange={(open) => {
          setEditCategoryOpen(open);
          if (!open) setEditingCategory(null);
        }}
        initialName={editingCategory?.name ?? ""}
        onSave={handleRenameCategory}
      />

      <AddItemSheet
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        categoryId={addItemCategoryId}
        categories={categories}
        onAdd={handleAddItem}
      />

      <Snackbar
        visible={undoSnackbar !== null}
        message={undoSnackbar?.message ?? ""}
        onAction={handleUndoDelete}
        bottomInset={insets.bottom + 80}
      />

      <AlertDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
      >
        <AlertDialogContent
          portalHost={TOP_OVERLAY_PORTAL_HOST}
          className="rounded-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCategory
                ? `Delete "${deletingCategory.name}" and all its items? This cannot be undone.`
                : "Delete this category and all its items?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl")}
              onPress={runDeleteCategory}
            >
              <Text>Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
