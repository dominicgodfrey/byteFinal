import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { Button, Field, FormError } from "../../components/ui";
import { theme } from "../../lib/theme";

export default function Register() {
  const { register, submitting } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Mirrors server rules for instant feedback, not security.
  function validate() {
    const next: Record<string, string> = {};

    if (name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords don't match";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const clearError = (key: string) =>
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));

  async function onSubmit() {
    setFormError(null);
    if (!validate()) return;

    const result = await register(name, email, password);

    if (!result.ok) {
      setFormError(result.message ?? "Could not create your account");
      if (result.fields) setErrors((e) => ({ ...e, ...result.fields }));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.sub}>Save recipes once, cook them at any size.</Text>

          <FormError message={formError} />

          <Field
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              clearError("name");
            }}
            error={errors.name}
            placeholder="Alex"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />

          <Field
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clearError("email");
            }}
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              clearError("password");
            }}
            error={errors.password}
            hint="At least 8 characters"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
          />

          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              clearError("confirm");
            }}
            error={errors.confirm}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />

          <Button title="Create account" onPress={onSubmit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.link}>Log in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { padding: 24, paddingTop: 48, flexGrow: 1, justifyContent: "center" },
  heading: { fontSize: 28, fontWeight: "800", color: theme.text },
  sub: { fontSize: 15, color: theme.muted, marginTop: 6, marginBottom: 28 },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
  footerText: { color: theme.muted },
  link: { color: theme.primary, fontWeight: "700" },
});
