import {
    GoogleSignin,
    isSuccessResponse,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { Luggage } from "lucide-react-native";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Pressable,
    View,
    useColorScheme
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoogleIcon } from "@/components/auth/google-icon";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { configureGoogleSignIn } from "@/lib/google-sign-in";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { isLoading, error, signInWithGoogle, setLoading, clearError } =
    useAuthStore();

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleSignIn = async () => {
    try {
      clearError();
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response) && response.data.idToken) {
        await signInWithGoogle(response.data.idToken);
      } else {
        setLoading(false);
      }
    } catch (signInError: unknown) {
      setLoading(false);
      if (
        typeof signInError === "object" &&
        signInError &&
        "code" in signInError &&
        signInError.code === statusCodes.IN_PROGRESS
      ) {
        return;
      }
      if (
        typeof signInError === "object" &&
        signInError &&
        "code" in signInError &&
        signInError.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View
        pointerEvents="none"
        className="absolute inset-0 overflow-hidden"
      >
        <View
          className={cn(
            "absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.07]",
            isDark ? "bg-primary" : "bg-[#208AEF]"
          )}
        />
        <View
          className={cn(
            "absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-[0.05]",
            isDark ? "bg-primary" : "bg-[#208AEF]"
          )}
        />
      </View>

      <View
        className="flex-1 px-6"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="flex-1 items-center justify-center">
          <View className="mb-8 items-center">
            <View className="mb-6 h-[88px] w-[88px] items-center justify-center rounded-[22px] bg-[#208AEF] shadow-lg shadow-[#208AEF]/25">
              <Icon as={Luggage} className="text-white" size={44} />
            </View>

            <Text
              variant="h1"
              className="mb-2 text-center text-[32px] font-bold tracking-tight"
            >
              <Text
                variant="h1"
                className="text-[32px] font-bold tracking-tight text-[#208AEF]"
              >
                {'A'}
              </Text>
              {'tt'}
              <Text
                variant="h1"
                className="text-[32px] font-bold tracking-tight text-[#208AEF]"
              >
                {'i'}
              </Text>
              {'re'}
            </Text>
            <Text
              variant="muted"
              className="max-w-[280px] text-center text-base leading-6"
            >
              Pack smarter for every trip with AI-powered outfit and checklist
              planning.
            </Text>
          </View>
        </View>

        <View className="w-full max-w-sm gap-4 self-center">
          {error ? (
            <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <Text className="text-center text-sm text-destructive">
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            className={cn(
              "h-[52px] flex-row items-center justify-center gap-3 rounded-xl border shadow-sm",
              isDark
                ? "border-border bg-card active:bg-accent"
                : "border-border bg-white active:bg-muted",
              isLoading && "opacity-70"
            )}
          >
            {isLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text className="text-[15px] font-semibold text-foreground">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Text
            variant="muted"
            className="px-2 text-center text-xs leading-5"
          >
            By continuing, you agree to our Terms of Service and Privacy
            Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}
