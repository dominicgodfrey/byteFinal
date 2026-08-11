import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../lib/theme";

/** Full-screen spinner for first loads. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={styles.mutedText}>{label}</Text>
    </View>
  );
}

/** Error state with a retry option. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={theme.muted} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.mutedText}>{message}</Text>
      {onRetry && (
        <Button title="Try again" onPress={onRetry} variant="secondary" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

export function EmptyState({
  icon = "book-outline",
  title,
  body,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={44} color={theme.muted} />
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.mutedText}>{body}</Text>
      {action && <View style={{ marginTop: 16 }}>{action}</View>}
    </View>
  );
}

/** Notice that the list came from cache. */
export function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={theme.warning} />
      <Text style={styles.bannerText}>Offline — showing your saved recipes</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: object;
}) {
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: theme.primary, fg: "#fff" },
    secondary: { bg: theme.surface, fg: theme.text },
    danger: { bg: theme.danger, fg: "#fff" },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg },
        variant === "secondary" && styles.buttonOutline,
        isDisabled && { opacity: 0.5 },
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={palette.fg} />}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Labelled input that renders its error underneath. */
export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.muted}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, !!error && styles.inputError, props.style]}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

/** Banner for a whole-form failure. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View style={styles.formError}>
      <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  errorTitle: { fontSize: 17, fontWeight: "700", color: theme.text, marginTop: 6 },
  mutedText: { color: theme.muted, textAlign: "center", lineHeight: 20 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.warningBg,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bannerText: { color: theme.warning, fontSize: 13, fontWeight: "600" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: theme.radius,
    minHeight: 50,
  },
  buttonOutline: { borderWidth: 1, borderColor: theme.border },
  buttonText: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 6 },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    minHeight: 48,
  },
  inputError: { borderColor: theme.danger, borderWidth: 1.5 },
  fieldError: { color: theme.danger, fontSize: 12.5, marginTop: 5, fontWeight: "600" },
  hint: { color: theme.muted, fontSize: 12.5, marginTop: 5 },
  formError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDECEA",
    borderRadius: theme.radius,
    padding: 12,
    marginBottom: 14,
  },
  formErrorText: { color: theme.danger, flex: 1, fontSize: 14, fontWeight: "600" },
  chip: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, color: theme.muted, fontWeight: "600" },
});
