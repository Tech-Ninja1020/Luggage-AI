import { type Href, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { LoginScreen } from "@/components/auth/login-screen";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/home" as Href} />;
  }

  return <LoginScreen />;
}
