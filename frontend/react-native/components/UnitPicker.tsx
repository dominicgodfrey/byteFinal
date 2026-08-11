import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUnits } from "../context/UnitsContext";
import { theme } from "../lib/theme";

const DIM_LABELS: Record<string, string> = {
  volume: "Volume",
  mass: "Weight",
  count: "Count",
};

/** Options come from UnitsContext, server driven. */
export function UnitPicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (unit: string) => void;
  hasError?: boolean;
}) {
  const { unitMap, byDim } = useUnits();
  const [open, setOpen] = useState(false);

  const label = unitMap[value]?.label ?? value ?? "unit";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Unit: ${label}. Tap to change.`}
        style={({ pressed }) => [
          styles.trigger,
          hasError && styles.triggerError,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose a unit</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={theme.muted} />
              </Pressable>
            </View>

            <ScrollView>
              {Object.entries(byDim).map(([dim, units]) => (
                <View key={dim} style={styles.group}>
                  <Text style={styles.groupTitle}>{DIM_LABELS[dim] ?? dim}</Text>
                  <View style={styles.options}>
                    {units.map((u) => {
                      const selected = u.key === value;

                      return (
                        <Pressable
                          key={u.key}
                          onPress={() => {
                            onChange(u.key);
                            setOpen(false);
                          }}
                          style={[styles.option, selected && styles.optionSelected]}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                            {u.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 3,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 10,
    minHeight: 48,
    width: 92,
  },
  triggerError: { borderColor: theme.danger, borderWidth: 1.5 },
  triggerText: { fontSize: 14, color: theme.text, fontWeight: "600", flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: theme.text },
  group: { marginBottom: 18 },
  groupTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  optionSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  optionText: { fontSize: 14, color: theme.text, fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
});
