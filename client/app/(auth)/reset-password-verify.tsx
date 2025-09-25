import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function ResetPasswordVerifyScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "");

    if (digit.length <= 1) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all fields are filled after this change
      if (newCode.every((c) => c !== "")) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleVerifyCode(newCode.join(""));
        }, 100);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      // Clear the previous field and focus it
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    // Use the passed code or current state
    const codeToVerify = verificationCode || code.join("");

    if (!codeToVerify || codeToVerify.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    // Additional validation: ensure all characters are digits
    if (!/^\d{6}$/.test(codeToVerify)) {
      Alert.alert("Error", "Code must contain only digits");
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        "🔒 Verifying reset code:",
        email,
        "with code:",
        codeToVerify
      );

      const response = await userAPI.verifyResetCode(
        email as string,
        codeToVerify
      );

      console.log("✅ verifyResetCode response:", response);

      if (response.success && response.resetToken) {
        console.log(
          "✅ Reset code verified successfully, navigating to reset password"
        );

        // Navigate to reset password screen
        router.push({
          pathname: "/(auth)/resetPassword",
          params: {
            resetToken: response.resetToken,
          },
        });
      } else {
        // If we get here, verification failed
        throw new Error(response.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("💥 Reset code verification error:", error);

      // Extract error message from different error formats
      let errorMessage = "Invalid verification code";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);

      // Clear the code inputs
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);
      console.log("🔄 Resending reset code...");

      const response = await userAPI.forgotPassword(email as string);

      if (response.success) {
        Alert.alert("Success", "A new reset code has been sent to your email");

        // Reset timer
        setTimeLeft(300);
        setCanResend(false);

        // Clear current code
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        // Start new timer
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(response.error || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("💥 Resend error:", error);
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
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
        <Text style={styles.headerTitle}>Verify Code</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={40} color="white" />
            </View>
            <Text style={styles.title}>Verify Reset Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.codeLabel}>Enter reset code</Text>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref!)}
                  style={[styles.codeInput, digit && styles.codeInputFilled]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  editable={!isLoading}
                  selectTextOnFocus={true}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!code.every((c) => c !== "") || isLoading) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={() => {
                const fullCode = code.join("");
                if (fullCode.length === 6) {
                  handleVerifyCode(fullCode);
                }
              }}
              disabled={!code.every((c) => c !== "") || isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? "Verifying..." : "Verify Code"}
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
                  Resend in {formatTime(timeLeft)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
