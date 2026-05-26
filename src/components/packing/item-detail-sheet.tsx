import { BottomSheet, useBottomSheetScroll } from "@/components/packing/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { TOP_OVERLAY_PORTAL_HOST } from "@/lib/portal-hosts";
import type { PackingItemRow } from "@/lib/types/packing";
import { cn } from "@/lib/utils";
import { Hash, MoreVertical, StickyNote, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  View,
  type TextStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Textarea } from "../ui/textarea";

const BORDERLESS_FIELD_CLASS = cn(
  "rounded-none border-0 border-width-0 bg-transparent shadow-none px-0",
  "outline-none focus-visible:border-0 focus-visible:ring-0",
  "native:border-0 native:bg-transparent"
);

const BORDERLESS_FIELD_STYLE: TextStyle = {
  borderWidth: 0,
  backgroundColor: "transparent",
};

type ItemDetailSheetProps = {
  item: PackingItemRow | null;
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<Pick<PackingItemRow, "name" | "quantity" | "notes" | "is_packed">>) => void;
  onDelete: () => void;
};

function ItemDeleteMenu({ onDelete }: { onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Item options"
          className="size-9 shrink-0 items-center justify-center rounded-full active:opacity-60"
        >
          <Icon as={MoreVertical} size={20} className="text-muted-foreground" />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        portalHost={TOP_OVERLAY_PORTAL_HOST}
        align="end"
        side="bottom"
        sideOffset={6}
        className="min-w-[140px] rounded-xl"
      >
        <DropdownMenuItem variant="destructive" onPress={onDelete}>
          <Icon as={Trash2} size={16} className="text-destructive" />
          <Text className="text-destructive font-medium">Delete</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function parseQuantity(value: string): number {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

function ItemDetailSheetBody({
  name,
  quantityText,
  notes,
  isPacked,
  onNameChange,
  onQuantityChange,
  onNotesChange,
  onTogglePacked,
}: {
  name: string;
  quantityText: string;
  notes: string;
  isPacked: boolean;
  onNameChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onTogglePacked: (packed: boolean) => void;
}) {
  const sheetScroll = useBottomSheetScroll();

  const scrollFieldIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      sheetScroll?.scrollToEnd(true);
      setTimeout(() => sheetScroll?.scrollToEnd(true), 100);
      setTimeout(() => sheetScroll?.scrollToEnd(true), 350);
    });
  }, [sheetScroll]);

  return (
    <View>
      <View className="flex-row items-start gap-3 pb-1 pt-2">
        <Checkbox
          checked={isPacked}
          onCheckedChange={(checked) => onTogglePacked(checked === true)}
          className="mt-1.5 size-6 rounded-full"
        />
        <Input
          value={name}
          onChangeText={onNameChange}
          placeholder="Item name"
          underlineColorAndroid="transparent"
          style={BORDERLESS_FIELD_STYLE}
          className={cn(
            BORDERLESS_FIELD_CLASS,
            "min-h-10 flex-1 py-0 text-xl font-semibold leading-tight",
            isPacked && "text-muted-foreground line-through"
          )}
          accessibilityLabel="Item name"
        />
      </View>

      <View className="flex-row items-center gap-3 py-3.5">
        <Icon as={Hash} size={20} className="text-muted-foreground shrink-0" />
        <Input
          value={quantityText}
          onChangeText={onQuantityChange}
          placeholder="1"
          maxLength={3}
          underlineColorAndroid="transparent"
          style={BORDERLESS_FIELD_STYLE}
          className={cn(
            BORDERLESS_FIELD_CLASS,
            "min-w-[48px] flex-1 text-base tabular-nums"
          )}
          accessibilityLabel="Quantity"
        />
      </View>

      <View className="flex-row gap-3 py-3.5">
        <Icon
          as={StickyNote}
          size={20}
          className="text-muted-foreground shrink-0"
        />

        <Textarea
          value={notes}
          onChangeText={onNotesChange}
          onFocus={scrollFieldIntoView}
          placeholder="Notes"
          underlineColorAndroid="transparent"
          textAlignVertical="top"
          style={BORDERLESS_FIELD_STYLE}
          className={cn(
            BORDERLESS_FIELD_CLASS,
            "min-h-[88px] flex-1 text-base leading-relaxed py-0"
          )}
          accessibilityLabel="Notes"
        />
      </View>
    </View>
  );
}

export function ItemDetailSheet({
  item,
  categoryName,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ItemDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [notes, setNotes] = useState("");
  const [isPacked, setIsPacked] = useState(false);

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setQuantityText(String(item.quantity));
    setNotes(item.notes ?? "");
    setIsPacked(item.is_packed);
  }, [item]);

  const handleQuantityChange = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "");
    setQuantityText(digits === "" ? "" : String(parseQuantity(digits)));
  }, []);

  const handleTogglePacked = useCallback(
    (packed: boolean) => {
      setIsPacked(packed);
      onUpdate({ is_packed: packed });
    },
    [onUpdate]
  );

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    Keyboard.dismiss();
    onUpdate({
      name: trimmedName,
      quantity: parseQuantity(quantityText),
      notes: notes.trim() || null,
    });
    onOpenChange(false);
  }, [name, quantityText, notes, onUpdate, onOpenChange]);

  if (!item) return null;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      showClose={false}
      header={
        <View className="flex-row items-center justify-between overflow-visible">
          <Text
            variant="muted"
            className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
            numberOfLines={1}
          >
            {categoryName}
          </Text>
          <ItemDeleteMenu onDelete={onDelete} />
        </View>
      }
      footer={
        <View
          className="pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            className="h-12 w-full rounded-xl"
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text>Save</Text>
          </Button>
        </View>
      }
    >
      <ItemDetailSheetBody
        name={name}
        quantityText={quantityText}
        notes={notes}
        isPacked={isPacked}
        onNameChange={setName}
        onQuantityChange={handleQuantityChange}
        onNotesChange={setNotes}
        onTogglePacked={handleTogglePacked}
      />
    </BottomSheet>
  );
}
