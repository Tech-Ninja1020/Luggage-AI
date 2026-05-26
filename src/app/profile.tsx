import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Check, LogOut, Shirt, UserRound } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import {
  fetchProfileForUser,
  upsertProfileForUser,
} from "@/lib/services/profile";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  GENDER_OPTIONS,
  OUTFIT_STYLE_OPTIONS,
  type Gender,
  type OutfitStyle,
} from "@/lib/types/profile";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut } = useAuthStore();

  const [gender, setGender] = useState<Gender | null>(null);
  const [outfitPreferences, setOutfitPreferences] = useState<Set<OutfitStyle>>(
    () => new Set()
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    setLoadError(null);
    setSaveSuccess(false);
    const { data, error } = await fetchProfileForUser(user.id);
    setLoadingProfile(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setGender(data?.gender ?? null);
    setOutfitPreferences(new Set(data?.outfit_preferences ?? []));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const toggleOutfitStyle = useCallback((style: OutfitStyle) => {
    setOutfitPreferences((prev) => {
      const next = new Set(prev);
      if (next.has(style)) next.delete(style);
      else next.add(style);
      return next;
    });
    setSaveSuccess(false);
  }, []);

  const onSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const { error } = await upsertProfileForUser(user.id, {
      gender,
      outfitPreferences: [...outfitPreferences],
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaveSuccess(true);
  };

  const onSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  };

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
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
              <Text className="text-xs font-medium text-primary">Profile</Text>
            </View>
            <View className="size-10" />
          </View>

          <View className="mb-8 items-center">
            <Avatar
              alt={user.displayName ? `${user.displayName} avatar` : "User avatar"}
              className="size-20 border-border/80 border shadow-sm"
            >
              {user.avatarUrl ? (
                <AvatarImage source={{ uri: user.avatarUrl }} />
              ) : null}
              <AvatarFallback>
                <Text className="text-xl font-semibold">
                  {initials(user.displayName)}
                </Text>
              </AvatarFallback>
            </Avatar>
            <Text variant="h3" className="mt-4 tracking-tight">
              {user.displayName}
            </Text>
            <Text variant="muted" className="mt-0.5 text-sm">
              {user.email}
            </Text>
          </View>

          {loadingProfile ? (
            <View className="items-center py-12">
              <ActivityIndicator />
              <Text variant="muted" className="mt-3 text-sm">
                Loading preferences…
              </Text>
            </View>
          ) : loadError ? (
            <View className="gap-3">
              <Text className="text-destructive text-sm">{loadError}</Text>
              <Button variant="outline" onPress={() => void loadProfile()}>
                <Text>Retry</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-8">
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Icon as={UserRound} size={18} className="text-muted-foreground" />
                  <Label>Gender</Label>
                </View>
                <Text variant="muted" className="text-sm leading-relaxed">
                  Helps tailor outfit suggestions for your trips.
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GENDER_OPTIONS.map((option) => {
                    const selected = gender === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setGender(option.value);
                          setSaveSuccess(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={[
                          "rounded-full border px-4 py-2",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 bg-card",
                        ].join(" ")}
                      >
                        <Text
                          className={[
                            "text-sm font-medium",
                            selected ? "text-primary" : "text-foreground",
                          ].join(" ")}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <Icon as={Shirt} size={18} className="text-muted-foreground" />
                  <Label>Outfit preferences</Label>
                </View>
                <Text variant="muted" className="text-sm leading-relaxed">
                  Select all styles that match how you usually dress. These apply
                  to AI outfit recommendations on new trips.
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {OUTFIT_STYLE_OPTIONS.map((option) => {
                    const selected = outfitPreferences.has(option.value);
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => toggleOutfitStyle(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={[
                          "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border/70 bg-card",
                        ].join(" ")}
                      >
                        {selected ? (
                          <Check size={14} className="text-primary" />
                        ) : null}
                        <Text
                          className={[
                            "text-sm font-medium",
                            selected ? "text-primary" : "text-foreground",
                          ].join(" ")}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {saveError ? (
                <View className="bg-destructive/10 border-destructive/30 rounded-xl border px-4 py-3">
                  <Text className="text-destructive text-sm">{saveError}</Text>
                </View>
              ) : null}

              {saveSuccess ? (
                <Text className="text-center text-sm font-medium text-primary">
                  Preferences saved
                </Text>
              ) : null}

              <Button
                className="h-12 rounded-xl"
                disabled={saving}
                onPress={() => void onSave()}
              >
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="font-semibold">Save preferences</Text>
                )}
              </Button>
            </View>
          )}

          <View className="border-border/60 mt-10 border-t pt-8">
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onPress={onSignOut}
            >
              <Icon as={LogOut} size={18} className="text-destructive" />
              <Text className="text-destructive font-semibold">Sign out</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
