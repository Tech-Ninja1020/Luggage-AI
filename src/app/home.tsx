import { Redirect } from "expo-router";
import { Luggage } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Icon as={Luggage} className="text-primary" size={32} />
        </View>
        <Text variant="h3" className="text-center">
          Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
        </Text>
        <Text variant="muted" className="text-center">
          Your packing workspace is ready.
        </Text>
      </View>

      <Button
        variant="outline"
        className="w-full"
        disabled={isLoading}
        onPress={() => signOut()}
      >
        <Text>Sign out</Text>
      </Button>
    </View>
  );
}
