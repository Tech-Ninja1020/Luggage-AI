import { BottomSheet, BottomSheetActions } from "@/components/packing/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";
import { View } from "react-native";

type EditCategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onSave: (name: string) => void;
};

export function EditCategorySheet({
  open,
  onOpenChange,
  initialName,
  onSave,
}: EditCategorySheetProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [initialName, open]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setName(initialName);
        onOpenChange(next);
      }}
      title="Edit category"
      description="Rename this group"
    >
      <View className="gap-2">
        <Label nativeID="category-edit-name">Category name</Label>
        <Input
          nativeID="category-edit-name"
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
        <Button
          className="h-11 flex-1 rounded-xl"
          onPress={handleSave}
          disabled={!name.trim() || name.trim() === initialName.trim()}
        >
          <Text>Save</Text>
        </Button>
      </BottomSheetActions>
    </BottomSheet>
  );
}

