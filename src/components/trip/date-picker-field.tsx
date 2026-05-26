import DateTimePicker from "@expo/ui/datetimepicker";
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

  return (
    <View className="flex-1 gap-1.5">
      <Text variant="muted" className="text-xs">
        {label}
      </Text>

      <View className="relative">
        <Pressable
          onPress={() => {
            if (Platform.OS !== "ios") {
              setShowPicker(true);
            }
          }}
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

        {Platform.OS === "ios" ? (
          <View
            className="absolute inset-0 z-10"
            style={{
              opacity: 0.02,
            }}
          >
            <DateTimePicker
              value={pickerValue}
              mode="date"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={(_event, selectedDate) => {
                if (selectedDate) {
                  onChange(dateToISODateString(selectedDate));
                }
              }}
            />
          </View>
        ) : null}
      </View>

      {Platform.OS !== "ios" && showPicker ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          presentation="dialog"
          onValueChange={(_event, selectedDate) => {
            setShowPicker(false);

            if (selectedDate) {
              onChange(dateToISODateString(selectedDate));
            }
          }}
          onDismiss={() => {
            setShowPicker(false);
          }}
        />
      ) : null}
    </View>
  );
}