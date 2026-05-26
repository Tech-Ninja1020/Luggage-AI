import { BottomSheet, BottomSheetActions } from "@/components/packing/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import type { PackingCategoryWithItems } from "@/lib/types/packing";
import { useEffect, useState } from "react";
import { View } from "react-native";

type AddItemSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  categories: PackingCategoryWithItems[];
  onAdd: (categoryId: string, name: string) => void;
};

export function AddItemSheet({
  open,
  onOpenChange,
  categoryId,
  categories,
  onAdd,
}: AddItemSheetProps) {
  const [name, setName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId);

  useEffect(() => {
    if (open) setSelectedCategoryId(categoryId ?? categories[0]?.id ?? null);
  }, [open, categoryId, categories]);

  const categoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? "Category";

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed || !selectedCategoryId) return;
    onAdd(selectedCategoryId, trimmed);
    setName("");
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
      title="New item"
      description={`Adding to ${categoryName}`}
    >
      <View className="gap-2">
        <Label nativeID="item-name-new">Item name</Label>
        <Input
          nativeID="item-name-new"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Umbrella"
          className="h-11 rounded-xl"
          autoFocus
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
