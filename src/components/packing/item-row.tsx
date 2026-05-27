import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { PackingItemRow } from "@/lib/types/packing";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react-native";
import { useCallback, useRef, type RefObject } from "react";
import { Platform, Pressable, View } from "react-native";
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

const DELETE_ACTION_WIDTH = 72;

type PackingItemRowProps = {
  item: PackingItemRow;
  onTogglePacked: (packed: boolean) => void;
  onPress: () => void;
  onDelete?: () => void;
  onSwipeableWillOpen?: () => void;
  onSwipeableOpen?: (ref: RefObject<SwipeableMethods | null>) => void;
};

function PackingItemRowContent({
  item,
  onTogglePacked,
  onPress,
}: Pick<PackingItemRowProps, "item" | "onTogglePacked" | "onPress">) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg bg-card px-1 py-2.5">
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

export function PackingItemRowView({
  item,
  onTogglePacked,
  onPress,
  onDelete,
  onSwipeableWillOpen,
  onSwipeableOpen,
}: PackingItemRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete?.();
  }, [onDelete]);

  const renderRightActions = useCallback(() => {
    return (
      <Pressable
        onPress={handleDelete}
        className="bg-destructive ml-2 w-[72px] items-center justify-center rounded-lg active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
      >
        <Icon as={Trash2} size={20} className="text-white" />
      </Pressable>
    );
  }, [handleDelete, item.name]);

  if (!onDelete || Platform.OS === "web") {
    return (
      <PackingItemRowContent
        item={item}
        onTogglePacked={onTogglePacked}
        onPress={onPress}
      />
    );
  }

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={DELETE_ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableOpen={(direction) => {
        onSwipeableOpen?.(swipeRef);
        if (direction === SwipeDirection.LEFT) {
          onDelete();
        }
      }}
      containerStyle={{ overflow: "visible" }}
    >
      <PackingItemRowContent
        item={item}
        onTogglePacked={onTogglePacked}
        onPress={onPress}
      />
    </ReanimatedSwipeable>
  );
}
