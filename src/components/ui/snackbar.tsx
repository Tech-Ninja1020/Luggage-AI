import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";
import { FadeInDown, FadeOutDown } from "react-native-reanimated";

type SnackbarProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  bottomInset?: number;
  className?: string;
};

export function Snackbar({
  visible,
  message,
  actionLabel = "Undo",
  onAction,
  bottomInset = 0,
  className,
}: SnackbarProps) {
  if (!visible) return null;

  return (
    <View
      className="absolute left-0 right-0 z-50 px-4"
      style={{ bottom: bottomInset }}
      pointerEvents="box-none"
    >
      <NativeOnlyAnimatedView
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(150)}
      >
        <View
          className={cn(
            "bg-foreground flex-row items-center gap-3 rounded-xl px-4 py-3 shadow-lg shadow-black/25",
            className
          )}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-background min-w-0 flex-1 text-sm" numberOfLines={2}>
            {message}
          </Text>
          {onAction ? (
            <Pressable
              onPress={onAction}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              className="shrink-0 rounded-md px-1 py-1 active:opacity-70"
            >
              <Text className="text-background text-sm font-bold">
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </NativeOnlyAnimatedView>
    </View>
  );
}
