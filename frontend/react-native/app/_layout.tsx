import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { RecipesProvider } from "../context/RecipesContext";
import { UnitsProvider } from "../context/UnitsContext";
import { Loading } from "../components/ui";
import { theme } from "../lib/theme";
import { BASE_URL } from "../config";

function RootNavigator() {
  const { token, restoring } = useAuth();

  // Wakes free hosting before the first real request.
  useEffect(() => {
    fetch(`${BASE_URL}/api/health`).catch(() => {});
  }, []);

  // Hold, or signed-in users flash the login screen.
  if (restoring) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Loading label="Getting your kitchen ready…" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Protected guard={!token}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="recipe/new"
            options={{ title: "New Recipe", presentation: "modal" }}
          />
          <Stack.Screen name="recipe/[id]/index" options={{ title: "Recipe" }} />
          <Stack.Screen name="recipe/[id]/edit" options={{ title: "Edit Recipe" }} />
          <Stack.Screen
            name="recipe/[id]/cook"
            options={{ title: "Cook Mode", headerBackTitle: "Recipe" }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UnitsProvider>
          <RecipesProvider>
            <RootNavigator />
          </RecipesProvider>
        </UnitsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
