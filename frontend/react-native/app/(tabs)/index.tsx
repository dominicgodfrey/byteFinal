import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../../context/RecipesContext";
import { RecipeCard } from "../../components/RecipeCard";
import { Loading, ErrorState, EmptyState, OfflineBanner, Button } from "../../components/ui";
import { theme } from "../../lib/theme";

export default function Library() {
  const router = useRouter();
  const { recipes, loading, error, offline, refresh } = useRecipes();

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Local filtering, so search works from cache.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;

    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [recipes, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // First load with nothing cached.
  if (loading && recipes.length === 0) return <Loading label="Loading your recipes…" />;

  if (error && recipes.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <View style={styles.container}>
      {offline && <OfflineBanner />}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes, tags, ingredients"
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search your recipe library"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={theme.muted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContent : styles.listContent
        }
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item._id}`)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          query ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              body={`Nothing in your library matches "${query}".`}
            />
          ) : (
            <EmptyState
              title="Your library is empty"
              body="Save a recipe once for a single serving. Bytes scales it up whenever you cook."
              action={
                <Button
                  title="Create your first recipe"
                  icon="add"
                  onPress={() => router.push("/recipe/new")}
                />
              }
            />
          )
        }
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={styles.count}>
              {filtered.length} recipe{filtered.length === 1 ? "" : "s"}
            </Text>
          ) : null
        }
      />

      <Pressable
        onPress={() => router.push("/recipe/new")}
        accessibilityRole="button"
        accessibilityLabel="New recipe"
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    minHeight: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.text, paddingVertical: 10 },
  listContent: { padding: 16, paddingBottom: 96 },
  emptyContent: { flexGrow: 1 },
  count: { fontSize: 12, color: theme.muted, marginBottom: 10, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
