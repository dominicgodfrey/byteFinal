import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { RecipeForm } from "../../components/RecipeForm";
import { useRecipes } from "../../context/RecipesContext";
import { theme } from "../../lib/theme";
import type { RecipeInput } from "../../types/Recipe";

export default function NewRecipe() {
  const router = useRouter();
  const { addRecipe } = useRecipes();

  async function handleSubmit(input: RecipeInput) {
    const result = await addRecipe(input);

    if (result.ok && result.data) {
      // Replace, so Back returns to the library.
      router.replace(`/recipe/${result.data._id}`);
    }

    return result;
  }

  return (
    <View style={styles.container}>
      <RecipeForm
        onSubmit={handleSubmit}
        submitLabel="Save recipe"
        draftKey="bytes.draft.new"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
});
