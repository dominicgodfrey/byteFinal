import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

const MIN = 1;
const MAX = 50;

/** Drives the live scaling on every ingredient amount. */
export function ServingsStepper({
  servings,
  onChange,
}: {
  servings: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  // Functional update, so fast taps cannot drop steps.
  const step = (delta: number) =>
    onChange((prev) => Math.min(MAX, Math.max(MIN, prev + delta)));

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.label}>Cooking for</Text>
        <Text style={styles.sub}>Amounts scale automatically</Text>
      </View>

      <View style={styles.controls}>
        <StepButton icon="remove" onPress={() => step(-1)} disabled={servings <= MIN} label="One fewer serving" />
        <View style={styles.count}>
          <Text style={styles.countText}>{servings}</Text>
          <Text style={styles.countLabel}>{servings === 1 ? "serving" : "servings"}</Text>
        </View>
        <StepButton icon="add" onPress={() => step(1)} disabled={servings >= MAX} label="One more serving" />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
  label,
}: {
  icon: "add" | "remove";
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.stepButton,
        disabled && { opacity: 0.35 },
        pressed && !disabled && { backgroundColor: theme.bg },
      ]}
    >
      <Ionicons name={icon} size={22} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 12,
  },
  label: { fontSize: 15, fontWeight: "700", color: theme.text },
  sub: { fontSize: 12, color: theme.muted, marginTop: 2 },
  controls: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { minWidth: 62, alignItems: "center" },
  countText: { fontSize: 24, fontWeight: "800", color: theme.primary, lineHeight: 28 },
  countLabel: { fontSize: 11, color: theme.muted },
});
