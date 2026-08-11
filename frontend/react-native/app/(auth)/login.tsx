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

export default function Login() {
  const { login, submitting } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const next: Record<string, string> = {};

    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That doesn't look like an email address";
    }

    if (!password) next.password = "Password is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    setFormError(null);
    if (!validate()) return;

    const result = await login(email, password);

    if (!result.ok) {
      setFormError(result.message ?? "Login failed");
      if (result.fields) setErrors(result.fields);
    }
    // On success the root guard swaps the navigator.
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
          <Text style={styles.logo}>Bytes</Text>
          <Text style={styles.tagline}>
            Your recipes, scaled to however many people showed up.
          </Text>

          <FormError message={formError} />

          <Field
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: "" }));
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
              if (errors.password) setErrors((e) => ({ ...e, password: "" }));
            }}
            error={errors.password}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />

          <Button title="Log in" onPress={onSubmit} loading={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.link}>Create an account</Text>
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
  scroll: { padding: 24, paddingTop: 60, flexGrow: 1, justifyContent: "center" },
  logo: { fontSize: 40, fontWeight: "800", color: theme.primary, textAlign: "center" },
  tagline: {
    fontSize: 15,
    color: theme.muted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 21,
  },
  footer: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
  footerText: { color: theme.muted },
  link: { color: theme.primary, fontWeight: "700" },
});
