import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Easing,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Eye,
  Brain,
  Sparkles,
  CircleCheck as CheckCircle,
  Scan,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface ScanningAnimationProps {
  visible: boolean;
  onComplete: () => void;
  progress?: number;
  isAnalyzing: boolean;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  visible,
  onComplete,
  progress = 0,
  isAnalyzing,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [progressState, setProgressState] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      key: "scanning",
      icon: Scan,
      label: "Scanning image...",
      color: "#10B981",
    },
    {
      key: "identifying",
      icon: Eye,
      label: "Identifying ingredients...",
      color: "#059669",
    },
    {
      key: "calculating",
      icon: Brain,
      label: "Calculating nutrition...",
      color: "#047857",
    },
    {
      key: "finalizing",
      icon: CheckCircle,
      label: "Finalizing results...",
      color: "#10B981",
    },
  ];

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  useEffect(() => {
    if (!isAnalyzing) {
      setProgressState(0);
      setCurrentStep(0);
      return;
    }

    let progressValue = 0;
    const interval = setInterval(() => {
      setProgressState((prev) => {
        progressValue = prev + 1;

        if (progressValue < 25) {
          setCurrentStep(0);
        } else if (progressValue < 50) {
          setCurrentStep(1);
        } else if (progressValue < 75) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }

        if (progressValue >= 95 && isAnalyzing) {
          return 95;
        }

        return Math.min(progressValue, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    startRotation();
    startPulse();
    startScanLine();
  };

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startScanLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const resetAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    rotateAnim.setValue(0);
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);
    progressAnim.setValue(0);
    setCurrentStep(0);
    setProgressState(0);
  };

  useEffect(() => {
    if (progressState >= 95 && !isAnalyzing) {
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }
  }, [progressState, isAnalyzing, onComplete]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const CurrentIcon = steps[currentStep]?.icon || Scan;
  const currentColor = steps[currentStep]?.color || "#10B981";
  const currentLabel = steps[currentStep]?.label || "Processing...";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.97)"
              : "rgba(255,255,255,0.97)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.scanningArea}>
            <LinearGradient
              colors={["rgba(16, 185, 129, 0.1)", "rgba(5, 150, 105, 0.05)"]}
              style={styles.scanningBackground}
            >
              <Animated.View
                style={[
                  styles.outerRing,
                  {
                    borderColor: currentColor,
                    transform: [{ rotate: spin }],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.innerCircle,
                  {
                    backgroundColor: currentColor + "20",
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <CurrentIcon size={56} color={currentColor} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: currentColor,
                    transform: [{ translateY: scanLineTranslateY }],
                  },
                ]}
              />

              {[...Array(4)].map((_, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.15],
                        outputRange: [0.3, 0.8],
                      }),
                      transform: [
                        { rotate: `${index * 90}deg` },
                        { translateY: -120 },
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.15],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Sparkles size={16} color={currentColor} />
                </Animated.View>
              ))}
            </LinearGradient>
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: isDark ? "#FFFFFF" : "#1A2744" }]}
            >
              Analyzing Your Meal
            </Text>
            <Text style={[styles.stepLabel, { color: currentColor }]}>
              {currentLabel}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text
                style={[
                  styles.progressLabel,
                  { color: isDark ? "#FFFFFF" : "#1A2744" },
                ]}
              >
                {progressState < 95 ? "Analyzing..." : "Complete!"}
              </Text>
              <Text style={[styles.progressPercent, { color: currentColor }]}>
                {Math.round(progressState)}%
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  {
                    width: `${progressState}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.stepsIndicator}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepDot}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index <= currentStep
                          ? step.color
                          : isDark
                          ? "#374151"
                          : "#E5E7EB",
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  scanningArea: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  scanningBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 140,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  innerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  scanLine: {
    position: "absolute",
    width: "80%",
    height: 3,
    opacity: 0.8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  particle: {
    position: "absolute",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    width: width - 80,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  stepsIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
