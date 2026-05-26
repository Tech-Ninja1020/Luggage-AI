import { BottomSheet, BottomSheetActions } from "@/components/packing/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useState } from "react";
import { View } from "react-native";

type AddCategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => void;
};

export function AddCategorySheet({
  open,
  onOpenChange,
  onAdd,
}: AddCategorySheetProps) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
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
      title="New category"
      description="Group related items together"
    >
      <View className="gap-2">
        <Label nativeID="category-name">Category name</Label>
        <Input
          nativeID="category-name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Accessories"
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
        <Button className="h-11 flex-1 rounded-xl" onPress={handleAdd} disabled={!name.trim()}>
          <Text>Add category</Text>
        </Button>
      </BottomSheetActions>
    </BottomSheet>
  );
}
