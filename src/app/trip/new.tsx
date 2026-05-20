import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, CalendarRange, Check, Tags } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityIcon } from "@/components/activity/activity-icon";
import { DatePickerField } from "@/components/trip/date-picker-field";
import { DestinationAutocomplete } from "@/components/trip/destination-autocomplete";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { isoStringToLocalDate, parseISODateString } from "@/lib/format/trip-dates";
import {
  createTrip,
  fetchActivityOptionsForUser,
} from "@/lib/services/trips";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { TripDestination } from "@/lib/types/destination";
import type { ActivityOptionRow } from "@/lib/types/trips";

export default function NewTripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const primaryButtonIndicatorColor =
    colorScheme === "dark" ? "#171717" : "#fafafa";

  const [destination, setDestination] = useState<TripDestination | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
    () => new Set()
  );

  const [options, setOptions] = useState<ActivityOptionRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activityRows = useMemo(() => {
    const rows: ActivityOptionRow[][] = [];
    for (let i = 0; i < options.length; i += 3) {
      rows.push(options.slice(i, i + 3));
    }
    return rows;
  }, [options]);

  const loadOptions = useCallback(async () => {
    if (!userId) return;
    setLoadingOptions(true);
    setOptionsError(null);
    const { data, error } = await fetchActivityOptionsForUser(userId);
    setLoadingOptions(false);
    if (error) {
      setOptionsError(error.message);
      setOptions([]);
      return;
    }
    setOptions(data ?? []);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadOptions();
    }, [loadOptions])
  );

  const setActivityChecked = useCallback((id: string, checked: boolean) => {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const startDateObj = useMemo(
    () => (startDate ? isoStringToLocalDate(startDate) : null),
    [startDate]
  );

  const handleStartDateChange = useCallback(
    (iso: string) => {
      setStartDate(iso);
      if (!iso || !endDate) return;
      const start = parseISODateString(iso);
      const end = parseISODateString(endDate);
      if (start && end && end < start) {
        setEndDate("");
      }
    },
    [endDate]
  );

  const dateValidationMessage = useMemo(() => {
    const s = startDate.trim();
    const e = endDate.trim();
    if (!s && !e) return null;
    const ds = s ? parseISODateString(s) : null;
    const de = e ? parseISODateString(e) : null;
    if (ds && de && de < ds) return "End date must be on or after the start date.";
    return null;
  }, [startDate, endDate]);

  const onSubmit = async () => {
    setFormError(null);
    if (!userId) {
      setFormError("You need to be signed in.");
      return;
    }
    if (!destination?.placeId) {
      setFormError("Select a destination from the search suggestions.");
      return;
    }
    if (dateValidationMessage) {
      setFormError(dateValidationMessage);
      return;
    }

    const s = startDate.trim() || null;
    const e = endDate.trim() || null;

    setSubmitting(true);
    const { error } = await createTrip({
      userId,
      destination,
      startDate: s,
      endDate: e,
      notes: notes.trim() || null,
      activityIds: [...selectedActivityIds],
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="active:bg-accent size-10 items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon as={ArrowLeft} className="text-foreground" size={22} />
            </Pressable>
            <View className="rounded-full bg-primary/10 px-3 py-1">
              <Text className="text-xs font-medium text-primary">New trip</Text>
            </View>
            <View className="size-10" />
          </View>

          <View className="mb-1 flex-row items-center gap-2">
            <View className="flex-1">
              <Text variant="h3" className="tracking-tight">
                Plan your next trip
              </Text>
              <Text variant="muted" className="mt-0.5 leading-relaxed">
                Add where you are going, when you will be there, and the kinds of
                things you will do — we will keep everything organized for your
                packing lists.
              </Text>
            </View>
          </View>

          <View className="border-border mt-6 gap-6">
            <View className="gap-2">
              <Label nativeID="dest-label">Destination</Label>
              <DestinationAutocomplete
                value={destination}
                onChange={setDestination}
                disabled={submitting}
              />
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={CalendarRange}
                    size={18}
                    className="text-muted-foreground"
                  />
                  <Label>Dates</Label>
                </View>
              </View>
              <View className="flex-row gap-3">
                <DatePickerField
                  label="Start"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
                <DatePickerField
                  label="End"
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDateObj ?? undefined}
                />
              </View>
              {dateValidationMessage ? (
                <Text className="text-destructive text-xs">
                  {dateValidationMessage}
                </Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Label nativeID="notes-label">Notes (optional)</Label>
              <Textarea
                accessibilityLabelledBy="notes-label"
                placeholder="Flights booked, hotel, reminders, packing notes…"
                value={notes}
                onChangeText={setNotes}
                numberOfLines={5}
                className="min-h-[120px] rounded-xl border-border/80 py-3 text-base leading-6"
              />
            </View>
          </View>

          <View className="mt-8 gap-3">
            <View className="flex-row items-center gap-2">
              <Icon as={Tags} size={18} className="text-muted-foreground" />
              <Text className="text-lg font-semibold tracking-tight">
                Activities
              </Text>
            </View>
            <Text variant="muted" className="text-sm leading-relaxed">
              Pick activity types that describe this trip. Custom templates you
              add to your library will appear here too.
            </Text>

            <View className="overflow-hidden">
              {loadingOptions ? (
                <View className="items-center py-12">
                  <ActivityIndicator />
                </View>
              ) : optionsError ? (
                <View className="gap-2">
                  <Text className="text-destructive text-sm">
                    {optionsError}
                  </Text>
                  <Button variant="outline" onPress={() => void loadOptions()}>
                    <Text>Retry</Text>
                  </Button>
                </View>
              ) : options.length === 0 ? (
                <View className="gap-2">
                  <Text className="text-foreground text-sm font-medium">
                    No activity templates yet
                  </Text>
                  <Text variant="muted" className="text-sm leading-relaxed">
                    Seed default templates in Supabase (see{" "}
                    <Text className="font-medium text-muted-foreground">
                      supabase/seed_default_activity_options.sql
                    </Text>
                    ) or add your own in{" "}
                    <Text className="font-medium text-muted-foreground">
                      activity_options
                    </Text>
                    . You can still save the trip without selecting any.
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {activityRows.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row gap-3">
                      {row.map((opt) => {
                        const selected = selectedActivityIds.has(opt.id);
                        return (
                          <View key={opt.id} className="min-w-0 flex-1">
                            <Pressable
                              onPress={() =>
                                setActivityChecked(opt.id, !selected)
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`${selected ? "Remove" : "Add"} ${opt.name}`}
                              className={[
                                "relative h-[140px] items-center justify-center rounded-[22px] border px-2.5",
                                "active:scale-[0.98]",
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "border-border/60 bg-card",
                              ].join(" ")}
                            >
                              <View className="absolute right-2.5 top-2.5 z-10">
                                <View
                                  className={[
                                    "h-5 w-5 items-center justify-center rounded-full border",
                                    selected
                                      ? "border-primary bg-primary"
                                      : "border-border/80 bg-background",
                                  ].join(" ")}
                                >
                                  {selected ? (
                                    <Check
                                      size={12}
                                      className="text-primary-foreground"
                                    />
                                  ) : null}
                                </View>
                              </View>

                              <View
                                className={[
                                  "mb-2.5 h-11 w-11 items-center justify-center rounded-2xl",
                                  selected ? "bg-primary/15" : "bg-muted/70",
                                ].join(" ")}
                              >
                                <ActivityIcon
                                  name={opt.name}
                                  selected={selected}
                                />
                              </View>

                              <Text
                                className={[
                                  "min-h-[36px] text-center text-[13px] font-semibold leading-5",
                                  selected
                                    ? "text-primary"
                                    : "text-foreground",
                                ].join(" ")}
                                numberOfLines={2}
                              >
                                {opt.name}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                      {row.length < 3
                        ? Array.from({ length: 3 - row.length }).map((_, i) => (
                            <View key={`pad-${rowIndex}-${i}`} className="flex-1" />
                          ))
                        : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {(formError ?? dateValidationMessage) && (
            <View className="bg-destructive/10 border-destructive/30 mt-6 rounded-xl border px-4 py-3">
              <Text className="text-destructive text-sm">
                {formError ?? dateValidationMessage}
              </Text>
            </View>
          )}

          <View className="mt-8 gap-3">
            <Button
              className="h-12 rounded-xl"
              disabled={submitting || !destination?.placeId}
              onPress={() => {
                if (dateValidationMessage) {
                  Alert.alert("Check dates", dateValidationMessage);
                  return;
                }
                void onSubmit();
              }}
            >
              {submitting ? (
                <ActivityIndicator color={primaryButtonIndicatorColor} />
              ) : (
                <Text className="font-semibold">Create trip</Text>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              disabled={submitting}
              onPress={() => router.back()}
            >
              <Text>Cancel</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
