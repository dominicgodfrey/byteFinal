import { Redirect } from "expo-router";

// Explicit landing route, not an alphabetical fallback.
export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}
