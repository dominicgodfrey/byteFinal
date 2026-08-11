import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useRecipes } from "../../../context/RecipesContext";
import { useUnits } from "../../../context/UnitsContext";
import { ServingsStepper } from "../../../components/ServingsStepper";
import { Button, Loading, ErrorState, Chip } from "../../../components/ui";
import { prettyAmount, scaleIngredients } from "../../../lib/units";
import { theme } from "../../../lib/theme";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { getRecipeById, fetchRecipe, deleteRecipe, deleteCook } = useRecipes();
  const { unitMap } = useUnits();

  const recipe = getRecipeById(id);

  const [servings, setServings] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Refetch on focus, so new cook photos appear.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      fetchRecipe(id).then((r) => {
        if (active && !r.ok && !recipe) setError(r.message ?? "Could not load that recipe");
      });

      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  useEffect(() => {
    navigation.setOptions({
      title: recipe?.title ?? "Recipe",
      headerRight: () =>
        recipe ? (
          <Pressable
            onPress={() => router.push(`/recipe/${id}/edit`)}
            hitSlop={8}
            accessibilityLabel="Edit recipe"
          >
            <Ionicons name="create-outline" size={22} color={theme.primary} />
          </Pressable>
        ) : null,
    });
  }, [navigation, recipe, id, router]);

  // Derived live from the stepper above.
  const scaled = useMemo(() => {
    if (!recipe) return [];
    return scaleIngredients(recipe.ingredients, servings);
  }, [recipe, servings]);

  function confirmDelete() {
    Alert.alert("Delete recipe?", `"${recipe?.title}" will be gone for good.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          const result = await deleteRecipe(id);
          setDeleting(false);

          if (result.ok) router.back();
          else Alert.alert("Couldn't delete", result.message ?? "Try again.");
        },
      },
    ]);
  }

  function confirmDeletePhoto(cookId: string) {
    Alert.alert("Remove this photo?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const result = await deleteCook(id, cookId);
          if (!result.ok) Alert.alert("Couldn't remove", result.message ?? "Try again.");
        },
      },
    ]);
  }

  if (!recipe && error) return <ErrorState message={error} onRetry={() => fetchRecipe(id)} />;
  if (!recipe) return <Loading label="Loading recipe…" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!!recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

      {recipe.tags.length > 0 && (
        <View style={styles.tags}>
          {recipe.tags.map((t) => (
            <Chip key={t} label={t} />
          ))}
        </View>
      )}

      <ServingsStepper servings={servings} onChange={setServings} />

      <Section title="Ingredients">
        {scaled.map((ing, i) => {
          const pretty = prettyAmount(ing.quantity, ing.unit, unitMap);

          return (
            <View key={`${ing.name}-${i}`} style={styles.row}>
              <Text style={styles.amount}>{pretty.text}</Text>
              <Text style={styles.ingredientName}>{ing.name}</Text>
            </View>
          );
        })}

        {servings !== 1 && (
          <Text style={styles.scaleNote}>
            Scaled {servings}× from the saved single-serving amounts.
          </Text>
        )}
      </Section>

      {recipe.steps.length > 0 && (
        <Section title="Method">
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Section>
      )}

      {recipe.cooks.length > 0 && (
        <Section title={`Made it (${recipe.cooks.length})`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {recipe.cooks.map((cook) => (
              <Pressable
                key={cook._id}
                onLongPress={() => confirmDeletePhoto(cook._id)}
                style={styles.cookCard}
                accessibilityLabel={`Photo from ${new Date(cook.cookedAt).toLocaleDateString()}. Long press to remove.`}
              >
                <Image source={{ uri: cook.photoUrl }} style={styles.cookPhoto} />
                <Text style={styles.cookMeta}>
                  {cook.servings} serving{cook.servings === 1 ? "" : "s"} ·{" "}
                  {new Date(cook.cookedAt).toLocaleDateString()}
                </Text>
                {!!cook.notes && (
                  <Text style={styles.cookNotes} numberOfLines={2}>
                    {cook.notes}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.hint}>Long-press a photo to remove it.</Text>
        </Section>
      )}

      <View style={styles.actions}>
        <Button
          title={`Cook for ${servings}`}
          icon="flame-outline"
          onPress={() => router.push(`/recipe/${id}/cook?servings=${servings}`)}
        />
        <Button
          title="Delete recipe"
          variant="danger"
          icon="trash-outline"
          onPress={confirmDelete}
          loading={deleting}
        />
      </View>
    </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  description: { fontSize: 15, color: theme.muted, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  section: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.text, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.primary,
    minWidth: 92,
  },
  ingredientName: { fontSize: 15, color: theme.text, flex: 1 },
  scaleNote: { fontSize: 12, color: theme.muted, marginTop: 12, fontStyle: "italic" },
  step: { flexDirection: "row", gap: 12, marginBottom: 14 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 12, fontWeight: "800", color: theme.primary },
  stepText: { flex: 1, fontSize: 15, color: theme.text, lineHeight: 22 },
  gallery: { marginHorizontal: -4 },
  cookCard: { width: 160, marginHorizontal: 4 },
  cookPhoto: { width: 160, height: 160, borderRadius: 10, backgroundColor: theme.bg },
  cookMeta: { fontSize: 11, color: theme.muted, marginTop: 6, fontWeight: "600" },
  cookNotes: { fontSize: 12, color: theme.text, marginTop: 2, lineHeight: 16 },
  hint: { fontSize: 11, color: theme.muted, marginTop: 10 },
  actions: { gap: 10 },
});
