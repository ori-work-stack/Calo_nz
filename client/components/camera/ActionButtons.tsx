import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Trash2,
  RefreshCw,
  CircleCheck as CheckCircle2,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

interface ActionButtonsProps {
  onDelete: () => void;
  onReAnalyze: () => void;
  onSave: () => void;
  isUpdating: boolean;
  isPosting: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDelete,
  onReAnalyze,
  onSave,
  isUpdating,
  isPosting,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onSave}
        disabled={isPosting}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#10B981", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradient}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={24} color="#FFFFFF" />
              <Text style={styles.primaryText}>
                {t("camera.saveMeal") || "Save Meal"}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.secondaryButtons}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.reanalyzeButton]}
          onPress={onReAnalyze}
          disabled={isUpdating}
          activeOpacity={0.7}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <RefreshCw size={20} color="#3B82F6" />
          )}
          <Text style={[styles.secondaryText, { color: "#3B82F6" }]}>
            {isUpdating
              ? t("common.updating") || "Updating..."
              : t("camera.reanalyze") || "Re-analyze"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, styles.deleteButton]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="#EF4444" />
          <Text style={[styles.secondaryText, { color: "#EF4444" }]}>
            {t("common.delete") || "Discard"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    marginVertical: 24,
    paddingHorizontal: 4,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reanalyzeButton: {
    borderWidth: 2,
    borderColor: "#E0F2FE",
  },
  deleteButton: {
    borderWidth: 2,
    borderColor: "#FEE2E2",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
