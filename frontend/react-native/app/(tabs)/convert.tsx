import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UnitPicker } from "../../components/UnitPicker";
import { useUnits } from "../../context/UnitsContext";
import { convert, formatQuantity } from "../../lib/units";
import { theme } from "../../lib/theme";

const QUICK: Array<[string, string]> = [
  ["cup", "ml"],
  ["tbsp", "tsp"],
  ["oz", "g"],
  ["lb", "kg"],
];

export default function Converter() {
  const { unitMap } = useUnits();

  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("cup");
  const [to, setTo] = useState("ml");

  // Uses the cached table, so works offline.
  const result = useMemo(() => {
    const q = Number(amount);

    if (!amount.trim()) return { text: "", error: null };
    if (!Number.isFinite(q) || q < 0) return { text: "", error: "Enter a number of 0 or more" };

    try {
      const converted = convert(q, from, to, unitMap);
      return { text: formatQuantity(converted), error: null, exact: converted };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Can't convert those" };
    }
  }, [amount, from, to, unitMap]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Convert between kitchen units. Works offline.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>From</Text>
          <View style={styles.row}>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholder="1"
              placeholderTextColor={theme.muted}
              accessibilityLabel="Amount to convert"
              maxLength={10}
            />
            <UnitPicker value={from} onChange={setFrom} />
          </View>

          <Pressable
            onPress={swap}
            style={styles.swap}
            accessibilityRole="button"
            accessibilityLabel="Swap units"
          >
            <Ionicons name="swap-vertical" size={20} color={theme.primary} />
            <Text style={styles.swapText}>Swap</Text>
          </Pressable>

          <Text style={styles.label}>To</Text>
          <View style={styles.row}>
            <View style={[styles.amountInput, styles.resultBox]}>
              <Text style={styles.resultText} numberOfLines={1}>
                {result.text || "—"}
              </Text>
            </View>
            <UnitPicker value={to} onChange={setTo} />
          </View>

          {!!result.error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
              <Text style={styles.errorText}>{result.error}</Text>
            </View>
          )}

          {!result.error && result.exact !== undefined && (
            <Text style={styles.exact}>
              exact: {result.exact.toFixed(4).replace(/\.?0+$/, "")} {unitMap[to]?.label ?? to}
            </Text>
          )}
        </View>

        <Text style={styles.quickLabel}>Common conversions</Text>
        <View style={styles.quickGrid}>
          {QUICK.map(([a, b]) => (
            <Pressable
              key={`${a}-${b}`}
              onPress={() => {
                setFrom(a);
                setTo(b);
              }}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Text style={styles.quickText}>
                {unitMap[a]?.label ?? a} → {unitMap[b]?.label ?? b}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={theme.muted} />
          <Text style={styles.noteText}>
            Volume, weight and count are kept separate. Converting cups of flour to grams
            depends on what the ingredient is, so Bytes won't guess at it.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: theme.muted, marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  label: { fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  amountInput: {
    flex: 1,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    fontSize: 22,
    fontWeight: "700",
    color: theme.text,
    minHeight: 56,
  },
  resultBox: { justifyContent: "center" },
  resultText: { fontSize: 22, fontWeight: "800", color: theme.primary },
  swap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 14,
  },
  swapText: { color: theme.primary, fontWeight: "700", fontSize: 14 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  errorText: { color: theme.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  exact: { color: theme.muted, fontSize: 12, marginTop: 12, textAlign: "right" },
  quickLabel: { fontSize: 13, fontWeight: "700", color: theme.text, marginTop: 24, marginBottom: 10 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  quickText: { fontSize: 13, color: theme.text, fontWeight: "600" },
  note: { flexDirection: "row", gap: 8, marginTop: 28, paddingRight: 8 },
  noteText: { flex: 1, fontSize: 12.5, color: theme.muted, lineHeight: 18 },
});
