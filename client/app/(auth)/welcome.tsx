import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isRTL = i18n.language === "he";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: "space-between",
      paddingTop: height * 0.15,
      paddingBottom: 60,
    },
    logoSection: {
      alignItems: "center",
      marginTop: height * 0.1,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    logoIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    appName: {
      fontSize: 42,
      fontWeight: "800",
      color: "white",
      letterSpacing: -1,
      textAlign: "center",
      marginBottom: 8,
      ...(isRTL && {
        writingDirection: "rtl",
        textAlign: "right",
      }),
    },
    tagline: {
      fontSize: 18,
      fontWeight: "500",
      color: "rgba(255, 255, 255, 0.9)",
      textAlign: "center",
      lineHeight: 24,
      ...(isRTL && {
        writingDirection: "rtl",
        textAlign: "right",
      }),
    },
    buttonSection: {
      gap: 16,
    },
    signUpButton: {
      backgroundColor: "white",
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
    },
    signUpButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    signInButton: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.8)",
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
    },
    signInButtonText: {
      fontSize: 18,
      fontWeight: "600",
      color: "white",
      letterSpacing: 0.5,
    },
    footerText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.7)",
      textAlign: "center",
      marginTop: 24,
      lineHeight: 20,
      ...(isRTL && {
        writingDirection: "rtl",
        textAlign: "center",
      }),
    },
    privacyLink: {
      color: "white",
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={[
          colors.primary,
          colors.emerald700 || "#047857",
          colors.emerald600 || "#059669",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="nutrition" size={36} color="white" />
            </View>
          </View>
          <Text style={styles.appName}>{t("welcome.appName")}</Text>
          <Text style={styles.tagline}>{t("welcome.tagline")}</Text>
        </View>

        <View style={styles.buttonSection}>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.signUpButton}>
              <Text style={styles.signUpButtonText}>
                {t("welcome.buttons.getStarted")}
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/signin" asChild>
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInButtonText}>
                {t("welcome.buttons.signIn")}
              </Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.footerText}>
            {t("welcome.footer.agreementText")}
            {isRTL ? " " : "\n"}
            <Text
              style={styles.privacyLink}
              onPress={() => router.push("/terms-of-service")}
            >
              {t("welcome.footer.termsOfService")}
            </Text>{" "}
            {t("welcome.footer.and")}{" "}
            <Text
              style={styles.privacyLink}
              onPress={() => router.push("/privacy-policy")}
            >
              {t("welcome.footer.privacyPolicy")}
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
