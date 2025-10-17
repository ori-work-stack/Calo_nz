import { Stack } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import React from "react";

export default function AdminLayout() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const { colors } = useTheme();

  console.log("🔍 Admin Layout - Checking access:", {
    user: user?.email,
    is_admin: user?.is_admin,
    is_super_admin: user?.is_super_admin
  });

  // Redirect if not admin
  if (!user || (!user.is_admin && !user.is_super_admin)) {
    console.log("❌ Admin Layout - Access denied, redirecting");
    return <Redirect href="/(tabs)" />;
  }

  console.log("✅ Admin Layout - Access granted");

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("admin.dashboard"),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: t("admin.users"),
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t("admin.settings"),
          headerShown: true,
        }}
      />
    </Stack>
  );
}
