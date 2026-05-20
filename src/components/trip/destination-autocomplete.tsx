import { MapPin } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  fetchPlaceDetails,
  fetchPlacePredictions,
  isGooglePlacesConfigured,
} from "@/lib/google-places";
import type { TripDestination } from "@/lib/types/destination";
import { cn } from "@/lib/utils";

type Props = {
  value: TripDestination | null;
  onChange: (destination: TripDestination | null) => void;
  disabled?: boolean;
  labelId?: string;
};

export function DestinationAutocomplete({
  value,
  onChange,
  disabled,
  labelId = "dest-label",
}: Props) {
  const [query, setQuery] = useState(value?.formattedAddress ?? "");
  const [predictions, setPredictions] = useState<
    Awaited<ReturnType<typeof fetchPlacePredictions>>["predictions"]
  >([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.formattedAddress);
    }
  }, [value?.placeId, value?.formattedAddress]);

  const search = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!text.trim() || text.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { predictions: next, error: err } = await fetchPlacePredictions(
      text,
      controller.signal
    );
    setLoading(false);
    setPredictions(next);
    setError(err);
    setOpen(next.length > 0 || !!err);
  }, []);

  useEffect(() => {
    if (value && query === value.formattedAddress) {
      return;
    }
    const timer = setTimeout(() => {
      void search(query);
    }, 320);
    return () => clearTimeout(timer);
  }, [query, search, value]);

  const onSelectPrediction = async (placeId: string, description: string) => {
    setOpen(false);
    setPredictions([]);
    setResolving(true);
    setError(null);
    setQuery(description);

    const { destination, error: err } = await fetchPlaceDetails(placeId);
    setResolving(false);

    if (err || !destination) {
      setError(err ?? "Could not load destination.");
      onChange(null);
      return;
    }

    onChange(destination);
    setQuery(destination.formattedAddress);
  };

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (value && text !== value.formattedAddress) {
      onChange(null);
    }
    setOpen(text.trim().length >= 2);
  };

  const configured = isGooglePlacesConfigured();

  return (
    <View className="gap-2">
      <View className="relative z-20">
        <View className="pointer-events-none absolute left-3 top-3.5 z-10">
          <Icon as={MapPin} size={18} className="text-muted-foreground" />
        </View>
        <TextInput
          nativeID={labelId}
          accessibilityLabel="Destination search"
          placeholder={
            configured ? "Search city or destination…" : "Configure Places API key"
          }
          value={query}
          onChangeText={onQueryChange}
          onFocus={() => {
            if (predictions.length > 0) setOpen(true);
          }}
          editable={!disabled && configured}
          autoCapitalize="words"
          autoCorrect={false}
          className={cn(
            "dark:bg-input/30 border-input bg-background text-foreground h-12 w-full rounded-xl border pl-10 pr-10 text-base shadow-sm shadow-black/5",
            disabled || !configured ? "opacity-60" : ""
          )}
        />
        {(loading || resolving) && (
          <View className="absolute right-3 top-3.5">
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      {!configured ? (
        <Text variant="muted" className="text-xs leading-relaxed">
          Set{" "}
          <Text className="font-medium text-muted-foreground">
            EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
          </Text>{" "}
          in your `.env` (Places API + Place Details enabled in Google Cloud).
        </Text>
      ) : null}

      {error ? (
        <Text className="text-destructive text-xs">{error}</Text>
      ) : null}

      {open && predictions.length > 0 ? (
        <View className="border-border/80 bg-card overflow-hidden rounded-xl border shadow-md shadow-black/10">
          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={{ maxHeight: 208 }}
            showsVerticalScrollIndicator={false}
          >
            {predictions.map((item, index) => (
              <Pressable
                key={item.placeId}
                onPress={() =>
                  void onSelectPrediction(item.placeId, item.description)
                }
                className={[
                  "active:bg-accent/70 px-4 py-3",
                  index < predictions.length - 1
                    ? "border-border/50 border-b"
                    : "",
                ].join(" ")}
              >
                <Text className="text-sm font-medium">{item.mainText}</Text>
                {item.secondaryText ? (
                  <Text variant="muted" className="mt-0.5 text-xs">
                    {item.secondaryText}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
