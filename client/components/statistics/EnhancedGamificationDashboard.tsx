import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Crown,
  Flame,
  Calendar,
  Star,
  Trophy,
  Zap,
  Target,
  Award,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";

interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  xpToNext: number;
  xpProgress: number;
  levelBenefits: string[];
  nextLevelBenefits: string[];
}

interface EnhancedGamificationDashboardProps {
  levelInfo: LevelInfo;
  statisticsData: any;
  language: string;
}

export const EnhancedGamificationDashboard: React.FC<
  EnhancedGamificationDashboardProps
> = ({ levelInfo, statisticsData, language }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const renderProgressBar = (progress: number, color: string) => (
    <View
      style={[styles.progressBackground, { backgroundColor: `${color}20` }]}
    >
      <Animated.View
        entering={FadeInUp}
        style={[
          styles.progressFill,
          {
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );

  return (
    <Animated.View entering={FadeInUp.delay(300)} style={styles.container}>
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.gradient}
      >
        {/* Level Section */}
        <View style={styles.levelSection}>
          <Animated.View entering={ZoomIn.delay(400)} style={styles.levelInfo}>
            <LinearGradient
              colors={[colors.warning, "#FFD700"]}
              style={styles.levelIcon}
            >
              <Crown size={32} color="#FFF" />
            </LinearGradient>
            <View style={styles.levelDetails}>
              <Text style={[styles.levelText, { color: colors.text }]}>
                {t("statistics.level") || "Level"} {levelInfo.currentLevel}
              </Text>
              <Text style={[styles.xpText, { color: colors.textSecondary }]}>
                {levelInfo.currentXP.toLocaleString()} /{" "}
                {levelInfo.nextLevelXP.toLocaleString()}{" "}
                {t("statistics.xp") || "XP"}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.progressContainer}>
            {renderProgressBar(levelInfo.xpProgress, colors.warning)}
            <Text
              style={[styles.progressText, { color: colors.textSecondary }]}
            >
              {levelInfo.xpToNext.toLocaleString()}{" "}
              {t("statistics.xp_to_next") || "XP to next level"}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInUp.delay(500)} style={styles.statItem}>
            <LinearGradient
              colors={[colors.error, "#FF6B6B"]}
              style={styles.statIcon}
            >
              <Flame size={20} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statisticsData?.currentStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("statistics.current_streak") || "Current Streak"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600)} style={styles.statItem}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.statIcon}
            >
              <Calendar size={20} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statisticsData?.perfectDays || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("statistics.perfect_days") || "Perfect Days"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700)} style={styles.statItem}>
            <LinearGradient
              colors={[colors.warning, "#FFA726"]}
              style={styles.statIcon}
            >
              <Star size={20} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statisticsData?.totalPoints?.toLocaleString() || "0"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("statistics.total_points") || "Total Points"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(800)} style={styles.statItem}>
            <LinearGradient
              colors={[colors.success, "#66BB6A"]}
              style={styles.statIcon}
            >
              <Trophy size={20} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statisticsData?.bestStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("statistics.best_streak") || "Best Streak"}
            </Text>
          </Animated.View>
        </View>

        {/* Level Benefits */}
        <Animated.View
          entering={FadeInUp.delay(900)}
          style={styles.benefitsSection}
        >
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            🎁 {t("statistics.level_benefits") || "Level Benefits"}
          </Text>
          <View style={styles.benefitsList}>
            {levelInfo.levelBenefits.slice(0, 3).map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Zap size={14} color={colors.success} />
                <Text
                  style={[styles.benefitText, { color: colors.textSecondary }]}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Next Level Preview */}
        <Animated.View
          entering={FadeInUp.delay(1000)}
          style={styles.nextLevelSection}
        >
          <Text style={[styles.nextLevelTitle, { color: colors.text }]}>
            🚀 {t("statistics.next_level_unlocks") || "Next Level Unlocks"}
          </Text>
          <View style={styles.nextBenefitsList}>
            {levelInfo.nextLevelBenefits.slice(0, 2).map((benefit, index) => (
              <View key={index} style={styles.nextBenefitItem}>
                <Target size={14} color={colors.primary} />
                <Text
                  style={[
                    styles.nextBenefitText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  levelSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  levelIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  levelDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    gap: 8,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: "500",
  },
  nextLevelSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
  },
  nextLevelTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  nextBenefitsList: {
    gap: 8,
  },
  nextBenefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextBenefitText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
