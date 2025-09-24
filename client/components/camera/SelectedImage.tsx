import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { X, RotateCcw, Zap, Camera, Sparkles } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface SelectedImageProps {
  imageUri: string;
  userComment: string;
  isAnalyzing: boolean;
  hasBeenAnalyzed: boolean;
  onRemoveImage: () => void;
  onRetakePhoto: () => void;
  onAnalyze: () => void;
  onCommentChange: (text: string) => void;
}

export const SelectedImage: React.FC<SelectedImageProps> = ({
  imageUri,
  userComment,
  isAnalyzing,
  hasBeenAnalyzed,
  onRemoveImage,
  onRetakePhoto,
  onAnalyze,
  onCommentChange,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Shimmer effect for image
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      // Start pulse animation during analysis
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnalyzing]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("camera.imagePreview.title")}
        </Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.background }]}
          onPress={onRemoveImage}
        >
          <X size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>

      {/* Image Container */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.imageWrapper, { backgroundColor: colors.border }]}>
          <Image source={{ uri: imageUri }} style={styles.image} />

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />

          {/* Analysis overlay */}
          {isAnalyzing && (
            <View style={styles.analysisOverlay}>
              <View
                style={[
                  styles.analysisIndicator,
                  { backgroundColor: colors.emerald500 + "90" },
                ]}
              >
                <Sparkles size={24} color="#FFFFFF" />
                <Text style={styles.analysisText}>
                  {t("camera.imagePreview.analyzing")}
                </Text>
              </View>
            </View>
          )}

          {/* Success indicator */}
          {hasBeenAnalyzed && !isAnalyzing && (
            <View style={styles.successIndicator}>
              <View
                style={[
                  styles.successBadge,
                  { backgroundColor: colors.emerald500 },
                ]}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.successText}>✓</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action buttons overlay */}
        <View style={styles.imageActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface + "E6" },
            ]}
            onPress={onRetakePhoto}
          >
            <Camera size={18} color={colors.icon} />
            <Text style={[styles.actionButtonText, { color: colors.icon }]}>
              {t("camera.imagePreview.retake")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Comment Input */}
      <View
        style={[styles.commentSection, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.commentLabel, { color: colors.text }]}>
          {t("camera.addDetails")}
        </Text>
        <TextInput
          style={[
            styles.commentInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={userComment}
          onChangeText={onCommentChange}
          placeholder={t("camera.detailsPlaceholder")}
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Analyze Button */}
      {!hasBeenAnalyzed && (
        <TouchableOpacity
          style={[styles.analyzeButton, { opacity: isAnalyzing ? 0.6 : 1 }]}
          onPress={onAnalyze}
          disabled={isAnalyzing}
        >
          <LinearGradient
            colors={[colors.emerald500, "#059669"]}
            style={styles.analyzeButtonGradient}
          >
            <Zap size={24} color="#FFFFFF" />
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing
                ? t("camera.analyzing")
                : t("camera.imagePreview.analyze")}
            </Text>
            {isAnalyzing && (
              <Animated.View
                style={[
                  styles.analyzeLoader,
                  {
                    transform: [
                      {
                        rotate: pulseAnim.interpolate({
                          inputRange: [1, 1.02],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.24,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 100,
  },
  analysisOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  analysisText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.24,
  },
  successIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.08,
  },
  imageActions: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.08,
  },
  commentSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: -0.08,
  },
  commentInput: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    minHeight: 80,
    letterSpacing: -0.24,
  },
  analyzeButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.24,
  },
  analyzeLoader: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderTopColor: "transparent",
    borderRadius: 8,
  },
});
