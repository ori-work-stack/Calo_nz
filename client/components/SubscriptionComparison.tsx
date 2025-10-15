import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Check, X, Sparkles } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

interface SubscriptionComparisonProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export default function SubscriptionComparison({
  visible,
  onClose,
  onUpgrade,
}: SubscriptionComparisonProps) {
  const { colors, isDark, emeraldSpectrum } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const plans = [
    {
      id: "FREE",
      name: "Free",
      description: "Perfect for getting started",
      color: colors.muted,
      accentColor: colors.textSecondary,
      features: [
        { text: "5 meal scans per month", included: true },
        { text: "Basic questionnaire (7 days)", included: true },
        { text: "Calorie tracking", included: true },
        { text: "Recipe access", included: true },
        { text: "AI Chat", included: false },
        { text: "AI Recommendations", included: false },
        { text: "Device Integration", included: false },
      ],
    },
    {
      id: "GOLD",
      name: "Gold",
      description: "Most popular choice",
      color: "#FF9500",
      accentColor: "#FF9500",
      recommended: true,
      features: [
        { text: "100 meal scans per month", included: true },
        { text: "Full questionnaire", included: true },
        { text: "Up to 100 AI chat messages", included: true },
        { text: "Detailed macro & vitamin tracking", included: true },
        { text: "AI personalized recommendations", included: true },
        { text: "Device integration", included: true },
        { text: "All recipes access", included: true },
      ],
    },
    {
      id: "PLATINUM",
      name: "Platinum",
      description: "Ultimate nutrition experience",
      color: emeraldSpectrum.emerald600,
      accentColor: emeraldSpectrum.emerald500,
      features: [
        { text: "Unlimited meal scans", included: true },
        { text: "Full questionnaire", included: true },
        { text: "Unlimited AI chat", included: true },
        { text: "Advanced AI menu planning", included: true },
        { text: "Full health tracking", included: true },
        { text: "Personal nutrition consulting", included: true },
        { text: "Priority support", included: true },
        { text: "Device integration", included: true },
      ],
    },
  ];

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={isDark ? 40 : 30}
          style={StyleSheet.absoluteFill}
          tint={isDark ? "dark" : "light"}
        />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={[styles.handleBar, { backgroundColor: colors.outline }]}
          />

          <View style={styles.header}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={[styles.title, { color: colors.text }]}>
                Choose Your Plan
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Select the plan that fits your lifestyle
              </Text>
            </Animated.View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceVariant },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {plans.map((plan, index) => (
              <Animated.View
                key={plan.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={plan.recommended ? onUpgrade : undefined}
                  disabled={!plan.recommended}
                >
                  <View
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: plan.recommended
                          ? plan.accentColor
                          : colors.border,
                      },
                      plan.recommended && {
                        borderWidth: 2,
                        shadowColor: plan.accentColor,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isDark ? 0.4 : 0.2,
                        shadowRadius: 16,
                        elevation: 8,
                      },
                    ]}
                  >
                    {plan.recommended && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: plan.accentColor,
                          },
                        ]}
                      >
                        <Sparkles
                          size={10}
                          color="#FFFFFF"
                          fill="#FFFFFF"
                          style={styles.badgeIcon}
                        />
                        <Text style={styles.badgeText}>POPULAR</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View
                        style={[
                          styles.planIconCircle,
                          {
                            backgroundColor:
                              plan.accentColor + (isDark ? "25" : "15"),
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.planIconRing,
                            {
                              borderColor:
                                plan.accentColor + (isDark ? "40" : "30"),
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.planIconDot,
                              { backgroundColor: plan.accentColor },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={[styles.planName, { color: colors.text }]}>
                          {plan.name}
                        </Text>
                        <Text
                          style={[
                            styles.planDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {plan.description}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <View style={styles.features}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <View
                            style={[
                              styles.checkCircle,
                              {
                                backgroundColor: feature.included
                                  ? plan.accentColor + (isDark ? "25" : "15")
                                  : colors.surfaceVariant,
                              },
                            ]}
                          >
                            {feature.included ? (
                              <Check
                                size={13}
                                color={plan.accentColor}
                                strokeWidth={3.5}
                              />
                            ) : (
                              <X
                                size={13}
                                color={colors.muted}
                                strokeWidth={2.5}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.featureText,
                              {
                                color: feature.included
                                  ? colors.text
                                  : colors.muted,
                                opacity: feature.included ? 1 : 0.6,
                              },
                            ]}
                          >
                            {feature.text}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {plan.recommended && (
                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          { backgroundColor: plan.accentColor },
                        ]}
                        onPress={onUpgrade}
                        activeOpacity={0.85}
                      >
                        <Sparkles size={16} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.selectButtonText}>Choose Plan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Cancel anytime · No hidden fees
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.92,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  planCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  badge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badgeIcon: {
    marginTop: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  planIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  planIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  planIconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  planDescription: {
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.1,
  },
  divider: {
    height: 1,
    marginBottom: 18,
    opacity: 0.5,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  selectButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  selectButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: 1,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
});
