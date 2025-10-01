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
import {
  X,
  RotateCcw,
  Zap,
  Camera,
  Sparkles,
  CreditCard as Edit2,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

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

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
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
      <Animated.View
        style={[
          styles.imageContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />

          {isAnalyzing && (
            <View style={styles.analysisOverlay}>
              <LinearGradient
                colors={["rgba(16, 185, 129, 0.95)", "rgba(5, 150, 105, 0.9)"]}
                style={styles.analysisIndicator}
              >
                <Sparkles size={28} color="#FFFFFF" />
                <Text style={styles.analysisText}>Analyzing...</Text>
              </LinearGradient>
            </View>
          )}

          {hasBeenAnalyzed && !isAnalyzing && (
            <View style={styles.successBadgeContainer}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.successBadge}
              >
                <Sparkles size={14} color="#FFFFFF" />
                <Text style={styles.successText}>Analyzed</Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onRemoveImage}
            >
              <BlurView intensity={80} tint="light" style={styles.blurButton}>
                <X size={20} color="#1A2744" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onRetakePhoto}
            >
              <BlurView intensity={80} tint="light" style={styles.blurButton}>
                <Camera size={20} color="#1A2744" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <View style={styles.commentSection}>
        <View style={styles.commentHeader}>
          <Edit2 size={18} color="#6B7E99" />
          <Text style={styles.commentLabel}>Add Notes (Optional)</Text>
        </View>
        <TextInput
          style={styles.commentInput}
          value={userComment}
          onChangeText={onCommentChange}
          placeholder="Any special requests or dietary notes..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {!hasBeenAnalyzed && (
        <TouchableOpacity
          style={[styles.analyzeButton, { opacity: isAnalyzing ? 0.6 : 1 }]}
          onPress={onAnalyze}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.analyzeButtonGradient}
          >
            <Zap size={24} color="#FFFFFF" />
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? "Analyzing..." : "Analyze Food"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  imageWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    position: "relative",
    backgroundColor: "#F8FAFC",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  analysisOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 10,
  },
  analysisText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  successBadgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 6,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  imageActions: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  blurButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSection: {
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7E99",
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 100,
    color: "#1A2744",
    textAlignVertical: "top",
  },
  analyzeButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
