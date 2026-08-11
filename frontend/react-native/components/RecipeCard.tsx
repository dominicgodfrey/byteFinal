import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";
import type { Recipe } from "../types/Recipe";

export function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const lastCook = recipe.cooks?.[recipe.cooks.length - 1];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${recipe.title}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
    >
      {lastCook ? (
        <Image source={{ uri: lastCook.photoUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="restaurant-outline" size={24} color={theme.muted} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>

        {!!recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.meta}>
          <Ionicons name="list-outline" size={13} color={theme.muted} />
          <Text style={styles.metaText}>
            {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? "" : "s"}
          </Text>

          {recipe.cooks?.length > 0 && (
            <>
              <Ionicons name="camera-outline" size={13} color={theme.muted} />
              <Text style={styles.metaText}>
                made {recipe.cooks.length}×
              </Text>
            </>
          )}

          {recipe.isPublic && <Ionicons name="globe-outline" size={13} color={theme.accent} />}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 10,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: theme.bg },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: "700", color: theme.text },
  description: { fontSize: 13, color: theme.muted, lineHeight: 18 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: theme.muted, marginRight: 6 },
});
