import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RecipeForm } from "../../../components/RecipeForm";
import { useRecipes } from "../../../context/RecipesContext";
import { ErrorState } from "../../../components/ui";
import { theme } from "../../../lib/theme";
import type { RecipeInput } from "../../../types/Recipe";

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRecipeById, updateRecipe, fetchRecipe } = useRecipes();

  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <ErrorState
        message="That recipe isn't loaded. Pull to refresh your library and try again."
        onRetry={() => fetchRecipe(id)}
      />
    );
  }

  async function handleSubmit(input: RecipeInput) {
    const result = await updateRecipe(id, input);
    if (result.ok) router.back();
    return result;
  }

  return (
    <View style={styles.container}>
      <RecipeForm initial={recipe} onSubmit={handleSubmit} submitLabel="Save changes" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
});
