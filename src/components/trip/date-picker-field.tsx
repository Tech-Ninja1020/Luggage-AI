import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  dateToISODateString,
  formatPickerDate,
  isoStringToLocalDate,
} from "@/lib/format/trip-dates";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** ISO `YYYY-MM-DD` or empty. */
  value: string;
  onChange: (iso: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
};

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = "Select date",
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = value ? isoStringToLocalDate(value) : null;
  const displayText = selectedDate
    ? formatPickerDate(selectedDate)
    : placeholder;

  const pickerValue = selectedDate ?? minimumDate ?? new Date();

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "dismissed" || !date) {
      return;
    }
    onChange(dateToISODateString(date));
  };

  return (
    <View className="flex-1 gap-1.5">
      <Text variant="muted" className="text-xs">
        {label}
      </Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayText}`}
        className={cn(
          "border-input bg-background active:bg-accent/40 h-12 flex-row items-center justify-between rounded-xl border px-3 shadow-sm shadow-black/5"
        )}
      >
        <Text
          className={cn(
            "text-base",
            selectedDate ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {displayText}
        </Text>
        <Icon as={CalendarDays} size={18} className="text-muted-foreground" />
      </Pressable>

      {showPicker ? (
        Platform.OS === "ios" ? (
          <View className="border-border/80 bg-card overflow-hidden rounded-xl border">
            <View className="border-border/60 flex-row justify-end border-b px-3 py-2">
              <Pressable
                onPress={() => setShowPicker(false)}
                accessibilityRole="button"
                className="px-2 py-1"
              >
                <Text className="text-primary text-sm font-semibold">Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="inline"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={onPickerChange}
            />
          </View>
        ) : (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display={Platform.OS === "web" ? "spinner" : "default"}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={onPickerChange}
          />
        )
      ) : null}
    </View>
  );
}
