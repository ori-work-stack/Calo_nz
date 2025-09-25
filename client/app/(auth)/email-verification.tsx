import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/src/store/authSlice";
import { AppDispatch } from "@/src/store";

const { width, height } = Dimensions.get("window");

export default function EmailVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(t("common.error"), t("auth.email_verification.invalid_code"));
      return;
    }

    setLoading(true);
    try {
      const userEmail = Array.isArray(email) ? email[0] : email || "";

      if (!userEmail) {
        throw new Error("Email parameter missing");
      }

      console.log("🔄 Dispatching email verification...");
      const result = await dispatch(
        verifyEmail({
          email: userEmail,
          code: verificationCode,
        })
      ).unwrap();

      console.log("✅ Email verification successful:", result);
      setLoading(false);

      Alert.alert(
        t("common.success"),
        t("auth.email_verification.verification_successful"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error("Email verification error:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("auth.email_verification.verification_failed")
      );
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const userEmail = Array.isArray(email) ? email[0] : email || "";

      if (!userEmail) {
        throw new Error("Email parameter missing");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setResendLoading(false);
        setCanResend(false);
        setCountdown(60);
        Alert.alert(
          t("common.success"),
          t("auth.email_verification.resend_successful")
        );
      } else {
        throw new Error(result.error || "Resend failed");
      }
    } catch (error: any) {
      setResendLoading(false);
      console.error("Resend verification error:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("auth.email_verification.resend_failed")
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 50 : 30,
      paddingHorizontal: 24,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: "#1C1C1E",
      textAlign: "center",
      marginRight: 36,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 48,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: "#1C1C1E",
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 17,
      color: "#8E8E93",
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    emailText: {
      fontWeight: "600",
      color: colors.primary,
    },
    formContainer: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 24,
      marginTop: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    codeLabel: {
      fontSize: 17,
      fontWeight: "600",
      color: "#1C1C1E",
      textAlign: "center",
      marginBottom: 24,
    },
    codeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 32,
    },
    codeInput: {
      width: 45,
      height: 55,
      borderRadius: 12,
      backgroundColor: "#F8F9FA",
      borderWidth: 2,
      borderColor: "#E5E5EA",
      fontSize: 24,
      fontWeight: "700",
      color: "#1C1C1E",
      textAlign: "center",
    },
    codeInputFilled: {
      borderColor: colors.primary,
      backgroundColor: "white",
    },
    verifyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    verifyButtonDisabled: {
      opacity: 0.6,
    },
    verifyButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "white",
      letterSpacing: 0.5,
    },
    resendContainer: {
      alignItems: "center",
    },
    resendText: {
      fontSize: 15,
      color: "#8E8E93",
      marginBottom: 12,
      textAlign: "center",
    },
    resendButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    resendButtonText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "500",
    },
    resendDisabledText: {
      fontSize: 15,
      color: "#C7C7CC",
    },
  });

  const renderOTPInputs = () => {
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(
        <TextInput
          key={i}
          style={[
            styles.codeInput,
            verificationCode.length > i && styles.codeInputFilled,
          ]}
          value={verificationCode[i] || ""}
          onChangeText={(text) => {
            if (text.length <= 1) {
              const newCode = verificationCode.split("");
              newCode[i] = text;
              setVerificationCode(newCode.join("").slice(0, 6));
            }
          }}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          editable={!loading}
        />
      );
    }
    return inputs;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Email</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="mail" size={40} color="white" />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.codeLabel}>Enter verification code</Text>

            <View style={styles.codeContainer}>{renderOTPInputs()}</View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || verificationCode.length !== 6) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              <Text style={styles.verifyButtonText}>
                {loading ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              {canResend ? (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={resendLoading}
                >
                  <Text style={styles.resendButtonText}>
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendDisabledText}>
                  Resend in {countdown}s
                </Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
