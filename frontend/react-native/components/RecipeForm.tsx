import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { UnitPicker } from "./UnitPicker";
import { Button, Field, FormError } from "./ui";
import { theme } from "../lib/theme";
import type { Recipe, RecipeInput } from "../types/Recipe";

type Row = { name: string; quantity: string; unit: string };
type Result = { ok: boolean; message?: string; fields?: Record<string, string> };

const emptyRow = (): Row => ({ name: "", quantity: "", unit: "g" });

/** Create and edit. Divides to one serving. */
export function RecipeForm({
  initial,
  onSubmit,
  submitLabel,
  draftKey,
}: {
  initial?: Recipe;
  onSubmit: (input: RecipeInput) => Promise<Result>;
  submitLabel: string;
  /** Autosaves in-progress input here, restored on relaunch. */
  draftKey?: string;
}) {
  const base = initial?.enteredForServings ?? 1;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [servingsText, setServingsText] = useState(String(base));
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");

  const [rows, setRows] = useState<Row[]>(
    initial
      ? initial.ingredients.map((i) => ({
          name: i.name,
          // Multiply back up, showing what the author typed.
          quantity: String(Number((i.quantity * base).toFixed(4))),
          unit: i.unit,
        }))
      : [emptyRow()]
  );

  const [steps, setSteps] = useState<string[]>(initial?.steps.length ? initial.steps : [""]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const restoredRef = useRef(false);

  useEffect(() => {
    if (!draftKey) return;

    (async () => {
      const saved = await AsyncStorage.getItem(draftKey).catch(() => null);
      if (!saved) {
        restoredRef.current = true;
        return;
      }

      try {
        const d = JSON.parse(saved);
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setServingsText(d.servingsText ?? "1");
        setTagsText(d.tagsText ?? "");
        setIsPublic(Boolean(d.isPublic));
        if (Array.isArray(d.rows) && d.rows.length) setRows(d.rows);
        if (Array.isArray(d.steps) && d.steps.length) setSteps(d.steps);
        setDraftRestored(true);
      } catch {
        // Corrupt draft, so start fresh.
      } finally {
        restoredRef.current = true;
      }
    })();
  }, [draftKey]);

  useEffect(() => {
    // Wait for restore, or blanks overwrite the draft.
    if (!draftKey || !restoredRef.current) return;

    const draft = { title, description, servingsText, tagsText, isPublic, rows, steps };
    AsyncStorage.setItem(draftKey, JSON.stringify(draft)).catch(() => {});
  }, [draftKey, title, description, servingsText, tagsText, isPublic, rows, steps]);

  async function discardDraft() {
    if (draftKey) await AsyncStorage.removeItem(draftKey).catch(() => {});

    setTitle("");
    setDescription("");
    setServingsText("1");
    setTagsText("");
    setIsPublic(false);
    setRows([emptyRow()]);
    setSteps([""]);
    setDraftRestored(false);
  }

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors((e) => {
      const next = { ...e };
      delete next[`ingredients.${index}.name`];
      delete next[`ingredients.${index}.quantity`];
      delete next[`ingredients.${index}.unit`];
      delete next.ingredients;
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));

  const updateStep = (index: number, text: string) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? text : s)));

  const addStep = () => setSteps((prev) => [...prev, ""]);

  const removeStep = (index: number) =>
    setSteps((prev) => (prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)));

  // Mirrors server rules for instant feedback, not security.
  function validate() {
    const next: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) next.title = "Give the recipe a name (2+ characters)";
    else if (trimmedTitle.length > 80) next.title = "Keep the name under 80 characters";

    if (description.trim().length > 500) {
      next.description = "Keep the description under 500 characters";
    }

    const servings = Number(servingsText);
    if (!Number.isFinite(servings) || servings < 1) {
      next.enteredForServings = "Enter 1 or more";
    }

    const filled = rows.filter((r) => r.name.trim() || r.quantity.trim());
    if (filled.length === 0) next.ingredients = "Add at least one ingredient";

    rows.forEach((row, i) => {
      const hasAny = row.name.trim() || row.quantity.trim();
      if (!hasAny) return;

      if (!row.name.trim()) next[`ingredients.${i}.name`] = "Name required";

      const q = Number(row.quantity);
      if (!row.quantity.trim()) next[`ingredients.${i}.quantity`] = "Amount required";
      else if (!Number.isFinite(q) || q <= 0) next[`ingredients.${i}.quantity`] = "Must be > 0";
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setFormError(null);
    if (!validate()) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const servings = Number(servingsText);

    const input: RecipeInput = {
      title: title.trim(),
      description: description.trim(),
      enteredForServings: servings,
      // Normalize to one serving, so scaling multiplies.
      ingredients: rows
        .filter((r) => r.name.trim() && r.quantity.trim())
        .map((r) => ({
          name: r.name.trim(),
          quantity: Number(r.quantity) / servings,
          unit: r.unit,
        })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      tags: tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      isPublic,
    };

    setSubmitting(true);
    const result = await onSubmit(input);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "Could not save");
      if (result.fields) setErrors(result.fields);
      return;
    }

    if (draftKey) await AsyncStorage.removeItem(draftKey).catch(() => {});
  }

  const servingsNum = Number(servingsText) || 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        // Otherwise the first tap only dismisses the keyboard.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {draftRestored && (
          <View style={styles.draftBanner}>
            <Ionicons name="document-text-outline" size={16} color={theme.warning} />
            <Text style={styles.draftText}>Unsaved draft restored</Text>
            <Pressable onPress={discardDraft} hitSlop={8}>
              <Text style={styles.draftDiscard}>Discard</Text>
            </Pressable>
          </View>
        )}

        <FormError message={formError} />

        <Field
          label="Recipe name"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            setErrors((e) => ({ ...e, title: "" }));
          }}
          error={errors.title}
          placeholder="Garlic pasta"
          returnKeyType="next"
          maxLength={80}
        />

        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          placeholder="What is it, and when would you make it?"
          multiline
          numberOfLines={3}
          maxLength={500}
          style={{ minHeight: 76, textAlignVertical: "top", paddingTop: 12 }}
        />

        <Field
          label="These amounts make how many servings?"
          value={servingsText}
          onChangeText={(t) => {
            setServingsText(t.replace(/[^0-9.]/g, ""));
            setErrors((e) => ({ ...e, enteredForServings: "" }));
          }}
          error={errors.enteredForServings}
          hint="Enter the recipe as you have it written. Bytes stores it per serving so it can scale to any size later."
          keyboardType="decimal-pad"
          placeholder="4"
          maxLength={4}
          style={{ width: 90 }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.sectionHint}>for {servingsNum} serving{servingsNum === 1 ? "" : "s"}</Text>
        </View>

        {!!errors.ingredients && <Text style={styles.sectionError}>{errors.ingredients}</Text>}

        {rows.map((row, i) => {
          const nameError = errors[`ingredients.${i}.name`];
          const qtyError = errors[`ingredients.${i}.quantity`];

          return (
            <View key={i} style={styles.rowWrap}>
              <View style={styles.row}>
                <TextInput
                  value={row.quantity}
                  onChangeText={(t) => updateRow(i, { quantity: t.replace(/[^0-9./]/g, "") })}
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  style={[styles.qtyInput, !!qtyError && styles.inputError]}
                  accessibilityLabel={`Ingredient ${i + 1} amount`}
                  maxLength={8}
                />

                <UnitPicker
                  value={row.unit}
                  onChange={(unit) => updateRow(i, { unit })}
                  hasError={!!errors[`ingredients.${i}.unit`]}
                />

                <TextInput
                  value={row.name}
                  onChangeText={(t) => updateRow(i, { name: t })}
                  placeholder="ingredient"
                  placeholderTextColor={theme.muted}
                  style={[styles.nameInput, !!nameError && styles.inputError]}
                  accessibilityLabel={`Ingredient ${i + 1} name`}
                  maxLength={60}
                />

                <Pressable
                  onPress={() => removeRow(i)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ingredient ${i + 1}`}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={22} color={theme.muted} />
                </Pressable>
              </View>

              {(nameError || qtyError) && (
                <Text style={styles.rowError}>{qtyError || nameError}</Text>
              )}
            </View>
          );
        })}

        <Pressable onPress={addRow} style={styles.addRow} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={styles.addRowText}>Add ingredient</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Method</Text>
          <Text style={styles.sectionHint}>optional</Text>
        </View>

        {steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <TextInput
              value={step}
              onChangeText={(t) => updateStep(i, t)}
              placeholder="What happens at this step?"
              placeholderTextColor={theme.muted}
              style={styles.stepInput}
              multiline
              accessibilityLabel={`Step ${i + 1}`}
            />
            <Pressable
              onPress={() => removeStep(i)}
              hitSlop={8}
              accessibilityLabel={`Remove step ${i + 1}`}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={22} color={theme.muted} />
            </Pressable>
          </View>
        ))}

        <Pressable onPress={addStep} style={styles.addRow} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={styles.addRowText}>Add step</Text>
        </Pressable>

        <View style={{ marginTop: 20 }}>
          <Field
            label="Tags"
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="dinner, quick, vegetarian"
            hint="Separate with commas"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Share publicly</Text>
            <Text style={styles.switchHint}>
              Public recipes appear in the Bytes web library for anyone to browse.
            </Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ true: theme.primary }}
            accessibilityLabel="Share this recipe publicly"
          />
        </View>

        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 60 },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.warningBg,
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 14,
  },
  draftText: { flex: 1, color: theme.warning, fontWeight: "600", fontSize: 13 },
  draftDiscard: { color: theme.danger, fontWeight: "700", fontSize: 13 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.text },
  sectionHint: { fontSize: 12, color: theme.muted },
  sectionError: { color: theme.danger, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  rowWrap: { marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyInput: {
    width: 64,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 10,
    fontSize: 15,
    color: theme.text,
    minHeight: 48,
    textAlign: "center",
  },
  nameInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 12,
    fontSize: 15,
    color: theme.text,
    minHeight: 48,
  },
  inputError: { borderColor: theme.danger, borderWidth: 1.5 },
  rowError: { color: theme.danger, fontSize: 12, marginTop: 4, marginLeft: 4, fontWeight: "600" },
  removeButton: { padding: 2 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  addRowText: { color: theme.primary, fontWeight: "700", fontSize: 15 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  stepNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.primary,
    width: 18,
    paddingTop: 14,
  },
  stepInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: theme.text,
    minHeight: 48,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    padding: 14,
    marginTop: 4,
  },
  switchLabel: { fontSize: 15, fontWeight: "700", color: theme.text },
  switchHint: { fontSize: 12, color: theme.muted, marginTop: 3, lineHeight: 17 },
});
