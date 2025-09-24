import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ImageSelectorProps {
  onTakePhoto: () => void;
  onSelectFromGallery: () => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({
  onTakePhoto,
  onSelectFromGallery,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.emerald500 + "15" },
        ]}
      >
        <Camera size={48} color={colors.emerald500} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {t("camera.title") || "Meal Scanner"}
      </Text>

      <Text style={[styles.subtitle, { color: colors.icon }]}>
        {t("camera.subtitle") ||
          "Take a photo or select from gallery to analyze your meal"}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.emerald500 }]}
          onPress={onTakePhoto}
        >
          <Camera size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {t("camera.takePhoto") || "Take Photo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.emerald500 }]}
          onPress={onSelectFromGallery}
        >
          <ImageIcon size={20} color={colors.emerald500} />
          <Text
            style={[styles.secondaryButtonText, { color: colors.emerald500 }]}
          >
            {t("camera.chooseFromGallery") || "Choose from Gallery"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: 20,
    letterSpacing: -0.24,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.24,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.24,
  },
});
