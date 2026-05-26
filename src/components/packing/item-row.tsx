import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/components/ui/text";
import type { PackingItemRow } from "@/lib/types/packing";
import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";

type PackingItemRowProps = {
  item: PackingItemRow;
  onTogglePacked: (packed: boolean) => void;
  onPress: () => void;
};

export function PackingItemRowView({
  item,
  onTogglePacked,
  onPress,
}: PackingItemRowProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg px-1 py-2.5">
      <Checkbox
        checked={item.is_packed}
        onCheckedChange={(checked) => onTogglePacked(checked === true)}
        className="size-5 rounded-md"
      />
      <Pressable
        onPress={onPress}
        className="min-w-0 flex-1 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={`${item.name}${item.quantity > 1 ? `, quantity ${item.quantity}` : ""}, open details`}
      >
        <View className="flex-row items-start gap-2">
          <Text
            className={cn(
              "min-w-0 flex-1 text-[15px] leading-snug",
              item.is_packed && "text-muted-foreground line-through"
            )}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.quantity > 1 ? (
            <Text
              variant="muted"
              className={cn(
                "shrink-0 text-xs font-semibold tabular-nums",
                item.is_packed && "line-through"
              )}
            >
              ×{item.quantity}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
