import { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { Ionicons } from "@expo/vector-icons";

import { useRecipes } from "../../../context/RecipesContext";
import { useUnits } from "../../../context/UnitsContext";
import { useAuth } from "../../../context/AuthContext";
import { Button, ErrorState, FormError, Loading } from "../../../components/ui";
import { uploadPhoto } from "../../../api/uploadPhoto";
import { prettyAmount, scaleIngredients } from "../../../lib/units";
import { theme } from "../../../lib/theme";

type Stage = "cooking" | "camera" | "review";

export default function CookMode() {
  const { id, servings: servingsParam } = useLocalSearchParams<{
    id: string;
    servings?: string;
  }>();
  const router = useRouter();

  const { getRecipeById, addCook } = useRecipes();
  const { unitMap } = useUnits();
  const { token } = useAuth();

  const recipe = getRecipeById(id);
  const servings = Math.max(1, Number(servingsParam) || 1);

  // No screen lock mid-recipe with wet hands.
  useKeepAwake();

  const [stage, setStage] = useState<Stage>("cooking");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const scaled = useMemo(
    () => (recipe ? scaleIngredients(recipe.ingredients, servings) : []),
    [recipe, servings]
  );

  if (!recipe) {
    return <ErrorState message="That recipe isn't loaded." onRetry={() => router.back()} />;
  }

  async function openCamera() {
    setError(null);

    // Three permission states, three responses. Never fail silently.
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        setError(
          result.canAskAgain
            ? "Camera access is needed to photograph your dish."
            : "Camera access is blocked. Enable it in Settings to add a photo."
        );
        return;
      }
    }

    setStage("camera");
  }

  async function capture() {
    try {
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!shot) throw new Error("The camera didn't return a photo");

      setPhoto(shot);
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not take the photo");
      setStage("cooking");
    }
  }

  async function save() {
    if (!photo || !token) return;

    setSaving(true);
    setError(null);

    try {
      const uploaded = await uploadPhoto(photo.uri, token);

      const result = await addCook(id, {
        photoUrl: uploaded.url,
        photoPublicId: uploaded.publicId,
        servings,
        notes: notes.trim(),
      });

      if (!result.ok) throw new Error(result.message ?? "Could not save");

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your photo");
    } finally {
      setSaving(false);
    }
  }

  if (stage === "camera") {
    if (!permission) return <Loading label="Checking camera…" />;

    return (
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={styles.cameraControls}>
          <Pressable
            onPress={() => setStage("cooking")}
            style={styles.cameraCancel}
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cameraCancelText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={capture}
            style={styles.shutter}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <View style={{ width: 60 }} />
        </View>
      </View>
    );
  }

  if (stage === "review" && photo) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Nice work</Text>
        <Text style={styles.sub}>
          Saving this to {recipe.title} at {servings} serving{servings === 1 ? "" : "s"}.
        </Text>

        <Image source={{ uri: photo.uri }} style={styles.preview} />

        <FormError message={error} />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Doubled the garlic. No regrets."
          placeholderTextColor={theme.muted}
          style={styles.notesInput}
          multiline
          maxLength={300}
          accessibilityLabel="Cook notes"
        />

        <View style={{ gap: 10, marginTop: 8 }}>
          <Button title="Save to recipe" onPress={save} loading={saving} icon="checkmark" />
          <Button
            title="Retake"
            variant="secondary"
            onPress={() => {
              setPhoto(null);
              setStage("camera");
            }}
            disabled={saving}
          />
        </View>

        {saving && <Text style={styles.uploadHint}>Uploading photo…</Text>}
      </ScrollView>
    );
  }

  const permissionBlocked = permission && !permission.granted && !permission.canAskAgain;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.banner}>
        <Ionicons name="flame" size={18} color={theme.primary} />
        <Text style={styles.bannerText}>
          Cooking for {servings} · screen stays awake
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ingredients</Text>
        {scaled.map((ing, i) => {
          const pretty = prettyAmount(ing.quantity, ing.unit, unitMap);

          return (
            <View key={`${ing.name}-${i}`} style={styles.row}>
              <Text style={styles.amount}>{pretty.text}</Text>
              <Text style={styles.ingredientName}>{ing.name}</Text>
            </View>
          );
        })}
      </View>

      {recipe.steps.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Method</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.finish}>
        <Text style={styles.finishTitle}>Made it?</Text>
        <Text style={styles.finishBody}>
          Take a photo and it'll be saved to this recipe with the serving size you cooked.
        </Text>

        <FormError message={error} />

        {permissionBlocked ? (
          <Button
            title="Open Settings"
            icon="settings-outline"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        ) : (
          <Button title="Take a photo" icon="camera-outline" onPress={openCamera} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  bannerText: { fontWeight: "700", color: theme.text, fontSize: 14 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: theme.text, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  amount: { fontSize: 16, fontWeight: "800", color: theme.primary, minWidth: 92 },
  ingredientName: { fontSize: 16, color: theme.text, flex: 1 },
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
  stepText: { flex: 1, fontSize: 16, color: theme.text, lineHeight: 24 },
  finish: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 10,
  },
  finishTitle: { fontSize: 18, fontWeight: "800", color: theme.text },
  finishBody: { fontSize: 14, color: theme.muted, lineHeight: 20, marginBottom: 4 },
  cameraWrap: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#000",
  },
  cameraCancel: { width: 60 },
  cameraCancelText: { color: "#fff", fontSize: 16 },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  heading: { fontSize: 26, fontWeight: "800", color: theme.text },
  sub: { fontSize: 14, color: theme.muted, marginTop: -8 },
  preview: { width: "100%", aspectRatio: 1, borderRadius: theme.radius, backgroundColor: theme.surface },
  label: { fontSize: 13, fontWeight: "700", color: theme.text },
  notesInput: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  uploadHint: { textAlign: "center", color: theme.muted, fontSize: 13 },
});
