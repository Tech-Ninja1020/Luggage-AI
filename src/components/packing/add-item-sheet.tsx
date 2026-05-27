import { BottomSheet, BottomSheetActions } from "@/components/packing/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { TOP_OVERLAY_PORTAL_HOST } from "@/lib/portal-hosts";
import type { PackingCategoryWithItems } from "@/lib/types/packing";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

type AddItemSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  categories: PackingCategoryWithItems[];
  /** When true, shows a category select (footer "Item" button). */
  showCategoryPicker?: boolean;
  onAdd: (categoryId: string, name: string) => void;
};

export function AddItemSheet({
  open,
  onOpenChange,
  categoryId,
  categories,
  showCategoryPicker = false,
  onAdd,
}: AddItemSheetProps) {
  const [name, setName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId);

  useEffect(() => {
    if (open) {
      setSelectedCategoryId(categoryId ?? categories[0]?.id ?? null);
    }
  }, [open, categoryId, categories]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectValue = useMemo(
    () =>
      selectedCategory
        ? { value: selectedCategory.id, label: selectedCategory.name }
        : undefined,
    [selectedCategory]
  );

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed || !selectedCategoryId) return;
    onAdd(selectedCategoryId, trimmed);
    setName("");
    onOpenChange(false);
  };

  const description = showCategoryPicker
    ? "Choose a category and name your item"
    : selectedCategory
      ? `Adding to ${selectedCategory.name}`
      : undefined;

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
      title="New item"
      description={description}
    >
      {showCategoryPicker && categories.length > 0 ? (
        <View className="mb-4 gap-2">
          <Label nativeID="item-category">Category</Label>
          <Select
            value={selectValue}
            onValueChange={(option) => {
              if (option) setSelectedCategoryId(option.value);
            }}
          >
            <SelectTrigger
              nativeID="item-category"
              className="h-11 w-full rounded-xl"
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent portalHost={TOP_OVERLAY_PORTAL_HOST}>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                  label={category.name}
                />
              ))}
            </SelectContent>
          </Select>
        </View>
      ) : null}
      <View className="gap-2">
        <Label nativeID="item-name-new">Item name</Label>
        <Input
          nativeID="item-name-new"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Umbrella"
          className="h-11 rounded-xl"
          autoFocus={!showCategoryPicker}
        />
      </View>
      <BottomSheetActions>
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onPress={() => onOpenChange(false)}
        >
          <Text>Cancel</Text>
        </Button>
        <Button
          className="h-11 flex-1 rounded-xl"
          onPress={handleAdd}
          disabled={!name.trim() || !selectedCategoryId}
        >
          <Text>Add item</Text>
        </Button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
