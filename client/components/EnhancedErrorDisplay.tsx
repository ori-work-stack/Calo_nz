import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { AlertTriangle, X, RefreshCw, Info } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";

interface EnhancedErrorDisplayProps {
  visible: boolean;
  error: any;
  onClose: () => void;
  onRetry?: () => void;
  context?: string;
}

export const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({
  visible,
  error,
  onClose,
  onRetry,
  context,
}) => {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isHebrew = language === "he";

  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const getErrorInfo = () => {
    let title = t("error.generic.title");
    let message = t("error.generic.message");
    let suggestion = t("error.generic.suggestion");

    // Check for Hebrew error message in the error object
    const errorMessage = error?.message || error?.response?.data?.error || "";
    const hasHebrewError = /[\u0590-\u05FF]/.test(errorMessage);

    // If error message contains Hebrew, use it directly
    if (hasHebrewError && isHebrew) {
      message = errorMessage;
    } else if (!hasHebrewError && !isHebrew && errorMessage) {
      message = errorMessage;
    }

    // Network errors
    if (error?.message?.includes("Network") || error?.code === "ERR_NETWORK") {
      title = t("error.network.title");
      message = t("error.network.message");
      suggestion = t("error.network.suggestion");
    }

    // API errors
    else if (error?.response?.data?.error) {
      message = error.response.data.error;
      if (isHebrew && error.response.data.error_he) {
        message = error.response.data.error_he;
      }
    }

    // Timeout errors
    else if (
      error?.code === "ECONNABORTED" ||
      error?.message?.includes("timeout")
    ) {
      title = t("error.timeout.title");
      message = t("error.timeout.message");
      suggestion = t("error.timeout.suggestion");
    }

    // Server errors
    else if (error?.response?.status >= 500) {
      title = t("error.server.title");
      message = t("error.server.message");
      suggestion = t("error.server.suggestion");
    }

    // Authentication errors
    else if (error?.response?.status === 401) {
      title = t("error.auth.title");
      message = t("error.auth.message");
      suggestion = t("error.auth.suggestion");
    }

    // Validation errors
    else if (error?.response?.status === 400) {
      title = t("error.validation.title");
      message = error?.response?.data?.error || error?.message || message;
      suggestion = t("error.validation.suggestion");
    }

    // AI/Menu generation specific errors
    else if (
      error?.message?.includes("ingredients") ||
      error?.message?.includes("רכיבים") ||
      error?.message?.includes("menu") ||
      error?.message?.includes("תפריט")
    ) {
      title = t("error.menuGeneration.title");
      message = error.message || message;
      suggestion = t("error.menuGeneration.suggestion");
    }

    // Dietary restriction conflicts
    else if (
      error?.message?.toLowerCase().includes("vegetarian") ||
      error?.message?.toLowerCase().includes("dietary") ||
      error?.message?.includes("צמחוני") ||
      error?.message?.includes("תזונתי")
    ) {
      title = t("error.dietary.title");
      message = error.message || message;
      suggestion = t("error.dietary.suggestion");
    }

    // Add context if provided
    if (context) {
      title = isHebrew
        ? `${context} - ${t("error.contextSuffix")}`
        : `${context} ${t("error.contextSuffix")}`;
    }

    return { title, message, suggestion };
  };

  const { title, message, suggestion } = getErrorInfo();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={isDark ? ["#dc2626", "#b91c1c"] : ["#ef4444", "#dc2626"]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <AlertTriangle size={28} color="#ffffff" />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.message,
                { color: colors.text, textAlign: isHebrew ? "right" : "left" },
              ]}
            >
              {message}
            </Text>

            {suggestion && (
              <View
                style={[
                  styles.suggestionBox,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Info size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.suggestion,
                    {
                      color: colors.primary,
                      textAlign: isHebrew ? "right" : "left",
                    },
                  ]}
                >
                  {suggestion}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {onRetry && (
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.emerald500 },
                  ]}
                  onPress={() => {
                    onClose();
                    onRetry();
                  }}
                >
                  <RefreshCw size={20} color="#ffffff" />
                  <Text style={styles.retryButtonText}>
                    {t("error.actions.tryAgain")}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.closeButtonBottom,
                  {
                    backgroundColor: colors.border,
                    marginRight: onRetry && !isHebrew ? 12 : 0,
                    marginLeft: onRetry && isHebrew ? 12 : 0,
                  },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>
                  {t("error.actions.close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  suggestionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  suggestion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButtonBottom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
