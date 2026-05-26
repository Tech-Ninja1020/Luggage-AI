import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@rn-primitives/dialog";
import { X } from "lucide-react-native";
import * as React from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";

import {
  DISMISS_DRAG_DISTANCE,
  DISMISS_DRAG_TRANSLATE,
  DISMISS_SHEET_DURATION_MS,
  DISMISS_VELOCITY,
  KEYBOARD_HIDE_DURATION_MS,
  KEYBOARD_SHOW_DURATION_ANDROID_MS,
  keyboardLiftOffset,
  PAN_ACTIVE_OFFSET_Y,
  sheetBottomPadding,
  sheetMaxHeight,
  sheetScrollMaxHeight,
  sheetScrollPaddingBottom,
  SPRING_DAMPING,
  SPRING_STIFFNESS,
} from "@/components/packing/bottom-sheet-constants";

const FullWindowOverlay = Platform.OS === "ios" ? RNFullWindowOverlay : React.Fragment;

type BottomSheetScrollContextValue = {
  scrollToEnd: (animated?: boolean) => void;
};

const BottomSheetScrollContext =
  createContext<BottomSheetScrollContextValue | null>(null);

export function useBottomSheetScroll() {
  return useContext(BottomSheetScrollContext);
}

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Replaces the default title/headerAction header when provided. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  showClose?: boolean;
  className?: string;
};

function useSheetDrag(onClose: () => void, open: boolean) {
  const translateY = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    if (open) {
      translateY.value = 0;
      keyboardOffset.value = 0;
    }
  }, [open, translateY, keyboardOffset]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      const offset = keyboardLiftOffset(event.endCoordinates.height);
      const duration =
        Platform.OS === "ios" && "duration" in event && event.duration
          ? event.duration
          : KEYBOARD_SHOW_DURATION_ANDROID_MS;
      keyboardOffset.value = withTiming(offset, { duration });
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, { duration: KEYBOARD_HIDE_DURATION_MS });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardOffset]);

  const dismissKeyboard = React.useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const closeSheet = React.useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(PAN_ACTIVE_OFFSET_Y)
    .onBegin(() => {
      runOnJS(dismissKeyboard)();
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldDismiss =
        event.translationY > DISMISS_DRAG_DISTANCE ||
        event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        translateY.value = withTiming(
          DISMISS_DRAG_TRANSLATE,
          { duration: DISMISS_SHEET_DURATION_MS },
          (finished) => {
            if (finished) {
              runOnJS(closeSheet)();
            }
          }
        );
      } else {
        translateY.value = withSpring(0, {
          damping: SPRING_DAMPING,
          stiffness: SPRING_STIFFNESS,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    marginBottom: keyboardOffset.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { panGesture, sheetStyle };
}

function SheetHandle({
  panGesture,
}: {
  panGesture: ReturnType<typeof useSheetDrag>["panGesture"];
}) {
  const handle = (
    <View
      className="items-center px-12 pb-2 pt-3"
      accessibilityRole="adjustable"
      accessibilityLabel="Drag to close"
    >
      <View className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
    </View>
  );

  if (Platform.OS === "web") {
    return handle;
  }

  return <GestureDetector gesture={panGesture}>{handle}</GestureDetector>;
}

function BottomSheetPanel({
  children,
  header,
  footer,
  className,
  showClose = true,
  onClose,
  open,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showClose?: boolean;
  onClose: () => void;
  open: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardTop, setKeyboardTop] = React.useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const { panGesture, sheetStyle } = useSheetDrag(onClose, open);

  const keyboardOpen = keyboardTop != null;

  useEffect(() => {
    if (!open) {
      setKeyboardTop(null);
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardTop(event.endCoordinates.screenY);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardTop(null);
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [open]);

  const scrollContext = React.useMemo<BottomSheetScrollContextValue>(
    () => ({
      scrollToEnd: (animated = true) => {
        scrollRef.current?.scrollToEnd({ animated });
      },
    }),
    []
  );

  const maxSheetHeight = sheetMaxHeight(windowHeight, keyboardTop, insets.top);
  const scrollMaxHeight = sheetScrollMaxHeight(maxSheetHeight, {
    hasHeader: Boolean(header),
    hasFooter: Boolean(footer),
  });
  const bottomPadding = footer
    ? 0
    : sheetBottomPadding(keyboardOpen, insets.bottom);
  const scrollPaddingBottom = sheetScrollPaddingBottom(keyboardOpen);

  const SheetWrapper = Platform.OS === "web" ? View : Animated.View;
  const wrapperProps =
    Platform.OS === "web"
      ? {
          style: {
            maxHeight: maxSheetHeight,
            marginBottom: keyboardLiftOffset(keyboardHeight),
          },
        }
      : {
          entering: SlideInDown.duration(280).springify().damping(22),
          exiting: SlideOutDown.duration(200),
          style: [sheetStyle, { maxHeight: maxSheetHeight }],
        };

  return (
    <BottomSheetScrollContext.Provider value={scrollContext}>
      <DialogPrimitive.Content
        className={cn(
          "bg-background border-border z-10 w-full max-w-full overflow-visible rounded-t-2xl border-t px-5 pt-2 shadow-2xl shadow-black/15",
          className
        )}
        style={{ paddingBottom: bottomPadding }}
        asChild={Platform.OS !== "web"}
      >
        <SheetWrapper {...wrapperProps} className="overflow-visible">
          <SheetHandle panGesture={panGesture} />
          {showClose ? (
            <DialogPrimitive.Close asChild>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="absolute right-4 top-3 z-10 rounded-full p-1 active:opacity-70"
              >
                <Icon as={X} size={20} className="text-muted-foreground" />
              </Pressable>
            </DialogPrimitive.Close>
          ) : null}
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled
            stickyHeaderIndices={header ? [0] : undefined}
            style={{ maxHeight: scrollMaxHeight }}
            contentContainerStyle={{
              paddingBottom: scrollPaddingBottom,
              flexGrow: 1,
            }}
          >
            {header ? (
              <View className="bg-background z-20 overflow-visible pb-4">
                {header}
              </View>
            ) : null}
            {children}
          </ScrollView>
          {footer ? (
            <View className="bg-background">
              {footer}
            </View>
          ) : null}
        </SheetWrapper>
      </DialogPrimitive.Content>
    </BottomSheetScrollContext.Provider>
  );
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  header: customHeader,
  footer,
  title,
  description,
  headerAction,
  showClose = true,
  className,
}: BottomSheetProps) {
  const handleClose = React.useCallback(() => {
    Keyboard.dismiss();
    onOpenChange(false);
  }, [onOpenChange]);

  const builtHeader =
    title || headerAction ? (
      <View
        className={cn(
          "flex-row items-start gap-2 overflow-visible",
          showClose && "pr-12"
        )}
      >
        {title ? (
          <View className="min-w-0 flex-1">
            <DialogPrimitive.Title asChild>
              <Text className="text-lg font-semibold tracking-tight">
                {title}
              </Text>
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description asChild>
                <Text variant="muted" className="mt-1 text-sm">
                  {description}
                </Text>
              </DialogPrimitive.Description>
            ) : null}
          </View>
        ) : (
          <View className="flex-1" />
        )}
        {headerAction}
      </View>
    ) : null;

  const header = customHeader ?? builtHeader;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <FullWindowOverlay>
          <View className="absolute bottom-0 left-0 right-0 top-0 justify-end">
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              className="absolute inset-0"
            >
              <Pressable
                className="absolute inset-0 bg-black/50"
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
              />
            </Animated.View>

            <BottomSheetPanel
              className={className}
              header={header}
              footer={footer}
              showClose={showClose}
              onClose={handleClose}
              open={open}
            >
              {children}
            </BottomSheetPanel>
          </View>
        </FullWindowOverlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function BottomSheetActions({
  className,
  ...props
}: ViewProps) {
  return <View className={cn("mt-4 flex-row gap-3", className)} {...props} />;
}

// Re-export layout constants for consumers that need to tune spacing.
export {
  KEYBOARD_SHEET_GAP,
  SHEET_HANDLE_HEIGHT
} from "@/components/packing/bottom-sheet-constants";

