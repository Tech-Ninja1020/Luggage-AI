import { CategoryIcon } from "@/components/packing/category-icon";
import { PackingItemRowView } from "@/components/packing/item-row";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { categoryProgress, sortItems } from "@/lib/packing/utils";
import { TOP_OVERLAY_PORTAL_HOST } from "@/lib/portal-hosts";
import type { PackingCategoryWithItems, PackingItemRow } from "@/lib/types/packing";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@rn-primitives/accordion";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react-native";
import type { ReactNode, RefObject } from "react";
import { useCallback, useRef } from "react";
import { Platform, Pressable, View } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

type CategorySectionProps = {
  category: PackingCategoryWithItems;
  onToggleItemPacked: (itemId: string, packed: boolean) => void;
  onItemPress: (item: PackingItemRow) => void;
  onAddItem: (categoryId: string) => void;
  onRenameCategory: (category: PackingCategoryWithItems) => void;
  onDeleteCategory: (category: PackingCategoryWithItems) => void;
  onDeleteItem: (itemId: string) => void;
};

function CategoryOptionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Category options"
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
        <DropdownMenuItem onPress={onEdit}>
          <Icon as={Pencil} size={16} className="text-foreground" />
          <Text className="font-medium">Edit</Text>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onPress={onDelete}>
          <Icon as={Trash2} size={16} className="text-destructive" />
          <Text className="text-destructive font-medium">Delete</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryAccordionHeader({
  children,
  menu,
}: {
  children: ReactNode;
  menu: ReactNode;
}) {
  const Trigger = Platform.OS === "web" ? View : Pressable;

  return (
    <AccordionPrimitive.Header className="flex-row items-center gap-1 pl-4 py-3.5">
      <AccordionPrimitive.Trigger asChild>
        <Trigger
          className={cn(
            "min-w-0 flex-1 flex-row items-start justify-between gap-2 active:opacity-80",
            Platform.select({
              web: "outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            })
          )}
        >
          <View className="min-w-0 flex-1 gap-2 pr-1">{children}</View>
        </Trigger>
      </AccordionPrimitive.Trigger>
      <View className="mt-0.5 shrink-0">{menu}</View>
    </AccordionPrimitive.Header>
  );
}

export function CategorySection({
  category,
  onToggleItemPacked,
  onItemPress,
  onAddItem,
  onRenameCategory,
  onDeleteCategory,
  onDeleteItem,
}: CategorySectionProps) {
  const { packed, total } = categoryProgress(category);
  const items = sortItems(category.packing_items);
  const openedSwipeableRef = useRef<SwipeableMethods | null>(null);

  const handleSwipeableWillOpen = useCallback(() => {
    openedSwipeableRef.current?.close();
  }, []);

  const handleSwipeableOpen = useCallback(
    (ref: RefObject<SwipeableMethods | null>) => {
      openedSwipeableRef.current = ref.current;
    },
    []
  );

  return (
    <AccordionItem
      value={category.id}
      className="border-border/70 mb-3 overflow-hidden rounded-2xl border bg-card shadow-sm shadow-black/5"
    >
      <CategoryAccordionHeader
        menu={
          <CategoryOptionsMenu
            onEdit={() => onRenameCategory(category)}
            onDelete={() => onDeleteCategory(category)}
          />
        }
      >
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <CategoryIcon name={category.name} />
            <Text className="min-w-0 flex-1 text-base font-semibold tracking-tight">
              {category.name}
            </Text>
          </View>
          <Text variant="muted" className="shrink-0 text-base font-semibold tabular-nums">
            {packed}/{total}
          </Text>
        </View>
      </CategoryAccordionHeader>
      <AccordionContent className="px-3 pb-2">
        {items.length !== 0 && (
          <View className="gap-0.5">
            {items.map((item) => (
              <PackingItemRowView
                key={item.id}
                item={item}
                onTogglePacked={(packed) => onToggleItemPacked(item.id, packed)}
                onPress={() => onItemPress(item)}
                onDelete={() => onDeleteItem(item.id)}
                onSwipeableWillOpen={handleSwipeableWillOpen}
                onSwipeableOpen={handleSwipeableOpen}
              />
            ))}
          </View>
        )}
        <Pressable
          onPress={() => onAddItem(category.id)}
          className="border-border/60 mt-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 active:bg-accent/40"
          accessibilityRole="button"
          accessibilityLabel={`Add item to ${category.name}`}
        >
          <Icon as={Plus} size={16} className="text-muted-foreground" />
          <Text variant="muted" className="text-sm font-medium">
            Add item
          </Text>
        </Pressable>
      </AccordionContent>
    </AccordionItem>
  );
}

export function CategoryAccordion({
  categories,
  defaultOpenIds,
  onToggleItemPacked,
  onItemPress,
  onAddItem,
  onRenameCategory,
  onDeleteCategory,
  onDeleteItem,
}: {
  categories: PackingCategoryWithItems[];
  defaultOpenIds: string[];
  onToggleItemPacked: (itemId: string, packed: boolean) => void;
  onItemPress: (item: PackingItemRow) => void;
  onAddItem: (categoryId: string) => void;
  onRenameCategory: (category: PackingCategoryWithItems) => void;
  onDeleteCategory: (category: PackingCategoryWithItems) => void;
  onDeleteItem: (itemId: string) => void;
}) {
  return (
    <Accordion type="multiple" defaultValue={defaultOpenIds} className="w-full">
      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          onToggleItemPacked={onToggleItemPacked}
          onItemPress={onItemPress}
          onAddItem={onAddItem}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </Accordion>
  );
}
