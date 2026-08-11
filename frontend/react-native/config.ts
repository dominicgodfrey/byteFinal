import { Platform } from "react-native";

// Physical phones need EXPO_PUBLIC_API_URL set.
const LOCALHOST =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCALHOST;
