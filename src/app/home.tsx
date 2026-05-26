import { type Href, Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronRight,
  Luggage,
  MapPin,
  Plus
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatTripDateRange } from "@/lib/format/trip-dates";
import { fetchTripsForUser } from "@/lib/services/trips";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { TripListItem } from "@/lib/types/trips";

function tripTitle(t: TripListItem): string {
  return (
    t.destination_name?.trim() ||
    t.destination_city?.trim() ||
    t.destination_country?.trim() ||
    "Untitled trip"
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, isLoading, isAuthenticated } = useAuthStore();
  const [trips, setTrips] = useState<TripListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!user?.id) return;
    setListError(null);
    const { data, error } = await fetchTripsForUser(user.id);
    if (error) {
      setListError(error.message);
      setTrips([]);
      return;
    }
    setTrips(data ?? []);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!user?.id) return;
        setListLoading(true);
        setListError(null);
        const { data, error } = await fetchTripsForUser(user.id);
        if (cancelled) return;
        setListLoading(false);
        if (error) {
          setListError(error.message);
          setTrips([]);
          return;
        }
        setTrips(data ?? []);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips, user?.id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="border-border/60 border-b px-5 pb-4"
      >
        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text
              variant="muted"
              className="text-xs font-medium uppercase tracking-wider"
            >
              Your journeys
            </Text>
            <Text variant="h3" className="mt-1 truncate tracking-tight">
              Trips
            </Text>
            <Text variant="muted" className="mt-1 max-w-[280px] text-sm">
              {user.displayName
                ? `Hi ${user.displayName.split(" ")[0]} — plan packs by destination and dates.`
                : "Plan packs by destination and dates."}
            </Text>
          </View>
          <Avatar
            alt={user.displayName ? `${user.displayName} avatar` : "User avatar"}
            className="size-11 border-border/80 border shadow-sm"
          >
            {user.avatarUrl ? (
              <AvatarImage source={{ uri: user.avatarUrl }} />
            ) : null}
            <AvatarFallback>
              <Text className="text-sm font-semibold">
                {initials(user.displayName)}
              </Text>
            </AvatarFallback>
          </Avatar>
        </View>

      </View>

      {listLoading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" />
          <Text variant="muted" className="mt-3 text-center text-sm">
            Loading trips…
          </Text>
        </View>
      ) : listError ? (
        <View className="flex-1 justify-center px-6">
          <Card className="border-destructive/25 rounded-2xl bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Could not load trips</CardTitle>
              <CardDescription>{listError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onPress={() => void loadTrips()}
              >
                <Text>Try again</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      ) : trips.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-primary/12 mb-5 size-16 items-center justify-center rounded-2xl">
            <Icon as={Luggage} className="text-primary" size={34} />
          </View>
          <Text className="text-center text-xl font-semibold tracking-tight">
            No trips yet
          </Text>
          <Text
            variant="muted"
            className="mt-2 max-w-sm text-center text-sm leading-relaxed"
          >
            Tap + to plan your first trip — destination, dates, and activities
            in one place.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 88,
            gap: 14,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const title = tripTitle(item);
            const subtitle = formatTripDateRange(item.start_date, item.end_date);
            const n = item.trip_activities?.length ?? 0;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/packing",
                    params: { tripId: item.id },
                  } as Href)
                }
                accessibilityRole="button"
                accessibilityLabel={`Open packing list for ${title}`}
              >
              <Card className="border-border/70 rounded-2xl py-0 shadow-sm shadow-black/5">
                <CardContent className="flex-row items-center gap-3 px-4 py-4">
                  <View className="bg-primary/10 size-12 items-center justify-center rounded-xl">
                    <Icon as={MapPin} className="text-primary" size={22} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-tight">
                      {title}
                    </CardTitle>
                    <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2 gap-y-1">
                      <View className="flex-row items-center gap-1">
                        <Icon
                          as={CalendarDays}
                          size={14}
                          className="text-muted-foreground"
                        />
                        <Text variant="muted" className="text-xs">
                          {subtitle}
                        </Text>
                      </View>
                      {n > 0 ? (
                        <View className="bg-secondary/90 rounded-full px-2.5 py-0.5">
                          <Text className="text-secondary-foreground text-[11px] font-medium">
                            {n} activit{n === 1 ? "y" : "ies"}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {item.destination_formatted_address &&
                    item.destination_formatted_address !== title ? (
                      <Text
                        variant="muted"
                        className="mt-1 text-xs leading-snug"
                        numberOfLines={1}
                      >
                        {item.destination_formatted_address}
                      </Text>
                    ) : null}
                  </View>
                  <Icon
                    as={ChevronRight}
                    size={20}
                    className="text-muted-foreground shrink-0"
                  />
                </CardContent>
              </Card>
              </Pressable>
            );
          }}
        />
      )}

      {!listLoading && !listError ? (
        <Pressable
          onPress={() => router.push("/trip/new" as Href)}
          accessibilityRole="button"
          accessibilityLabel="New trip"
          className="bg-primary active:bg-primary/90 absolute right-5 size-14 items-center justify-center rounded-full shadow-lg shadow-black/20"
          style={{ bottom: insets.bottom + 20 }}
        >
          <Icon
            as={Plus}
            className="text-primary-foreground"
            size={26}
            strokeWidth={2.5}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
