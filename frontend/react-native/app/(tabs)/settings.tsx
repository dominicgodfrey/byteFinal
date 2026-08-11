import { useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { useRecipes } from "../../context/RecipesContext";
import { Button } from "../../components/ui";
import { theme } from "../../lib/theme";
import { BASE_URL } from "../../config";

export default function Settings() {
  const { user, logout } = useAuth();
  const { recipes, offline, refresh } = useRecipes();
  const [clearing, setClearing] = useState(false);

  const cookCount = recipes.reduce((sum, r) => sum + (r.cooks?.length ?? 0), 0);

  function confirmLogout() {
    Alert.alert("Log out?", "You'll need your password to get back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  function confirmClearCache() {
    Alert.alert(
      "Clear offline cache?",
      "Your recipes stay safe on the server. This just clears what's stored on this phone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setClearing(true);

            const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
            const ours = keys.filter((k) => k.startsWith("bytes."));
            await AsyncStorage.multiRemove(ours).catch(() => {});

            await refresh();
            setClearing(false);
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={recipes.length} label={recipes.length === 1 ? "recipe" : "recipes"} />
        <Stat value={cookCount} label={cookCount === 1 ? "photo" : "photos"} />
      </View>

      <Section title="Connection">
        <Row
          icon={offline ? "cloud-offline-outline" : "cloud-done-outline"}
          label={offline ? "Offline — using saved recipes" : "Connected"}
          value={BASE_URL.replace(/^https?:\/\//, "")}
        />
      </Section>

      <Section title="Storage">
        <Text style={styles.sectionBody}>
          Recipes are cached on this phone so your library and cook mode keep working without
          a connection. Your login token is kept separately in the device's secure keystore.
        </Text>
        <Button
          title="Clear offline cache"
          variant="secondary"
          icon="trash-outline"
          onPress={confirmClearCache}
          loading={clearing}
        />
      </Section>

      <Button
        title="Log out"
        variant="danger"
        icon="log-out-outline"
        onPress={confirmLogout}
        style={{ marginTop: 8 }}
      />

      <Text style={styles.version}>Bytes v1.0.0</Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={theme.muted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: theme.text },
  email: { fontSize: 14, color: theme.muted, marginTop: 2 },
  stats: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 26, fontWeight: "800", color: theme.primary },
  statLabel: { fontSize: 12, color: theme.muted, marginTop: 2 },
  section: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: theme.text },
  sectionBody: { fontSize: 13, color: theme.muted, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 14, color: theme.text, fontWeight: "600" },
  rowValue: { fontSize: 12, color: theme.muted, marginTop: 1 },
  version: { textAlign: "center", color: theme.muted, fontSize: 12, marginTop: 12 },
});
