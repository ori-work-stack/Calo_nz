import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Star,
  Crown,
  Medal,
  Award,
  X,
  Flame,
  Target,
  Sparkles,
  Droplets,
  Calendar,
  Zap,
  ChevronRight,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Achievement } from "@/src/types/statistics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AchievementsSectionProps {
  achievements: Achievement[];
  period: "today" | "week" | "month";
}

const getAchievementIcon = (
  iconName: string,
  size: number = 20,
  color: string = "#16A085"
) => {
  const iconProps = { size, color };

  switch (iconName) {
    case "target":
      return <Target {...iconProps} />;
    case "sparkles":
      return <Sparkles {...iconProps} />;
    case "star":
      return <Star {...iconProps} />;
    case "medal":
      return <Medal {...iconProps} />;
    case "trophy":
      return <Trophy {...iconProps} />;
    case "crown":
      return <Crown {...iconProps} />;
    case "droplets":
      return <Droplets {...iconProps} />;
    case "flame":
      return <Flame {...iconProps} />;
    case "calendar":
      return <Calendar {...iconProps} />;
    case "zap":
      return <Zap {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return "#F59E0B";
    case "EPIC":
      return "#8B5CF6";
    case "RARE":
      return "#3B82F6";
    case "UNCOMMON":
      return "#059669";
    case "COMMON":
    default:
      return "#10B981";
  }
};

const getRarityGradient = (rarity: string) => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return ["#FEF3C7", "#FDE68A"];
    case "EPIC":
      return ["#EDE9FE", "#DDD6FE"];
    case "RARE":
      return ["#DBEAFE", "#BFDBFE"];
    case "UNCOMMON":
      return ["#D1FAE5", "#A7F3D0"];
    case "COMMON":
    default:
      return ["#ECFDF5", "#D1FAE5"];
  }
};

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  period,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: t("achievements.categories.all") || "All" },
    {
      key: "MILESTONE",
      label: t("achievements.categories.milestone") || "Milestones",
    },
    { key: "STREAK", label: t("achievements.categories.streak") || "Streaks" },
    { key: "GOAL", label: t("achievements.categories.goal") || "Goals" },
    {
      key: "SPECIAL",
      label: t("achievements.categories.special") || "Special",
    },
  ];

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter(
      (achievement) => achievement.category === selectedCategory
    );
  }, [achievements, selectedCategory]);

  const unlockedAchievements = useMemo(
    () => filteredAchievements.filter((a) => a.unlocked),
    [filteredAchievements]
  );

  const lockedAchievements = useMemo(
    () => filteredAchievements.filter((a) => !a.unlocked),
    [filteredAchievements]
  );

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const rarityColor = getRarityColor(achievement.rarity);
    const gradientColors = getRarityGradient(achievement.rarity);
    const progressPercentage =
      (achievement.progress / (achievement.maxProgress || 1)) * 100;

    return (
      <Animated.View
        key={achievement.id}
        entering={FadeInUp.delay(index * 100)}
        style={styles.achievementCard}
      >
        <LinearGradient
          colors={
            achievement.unlocked
              ? gradientColors
              : [colors.surface, colors.surfaceVariant]
          }
          style={[
            styles.achievementGradient,
            { opacity: achievement.unlocked ? 1 : 0.6 },
          ]}
        >
          <View style={styles.achievementHeader}>
            <View
              style={[
                styles.achievementIconContainer,
                {
                  backgroundColor: achievement.unlocked
                    ? rarityColor + "20"
                    : colors.outline,
                },
              ]}
            >
              {getAchievementIcon(
                achievement.icon,
                24,
                achievement.unlocked ? rarityColor : colors.textSecondary
              )}
            </View>

            <View style={styles.achievementInfo}>
              <Text
                style={[
                  styles.achievementTitle,
                  {
                    color: achievement.unlocked
                      ? colors.text
                      : colors.textSecondary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {language === "he" && achievement.title
                  ? achievement.title
                  : achievement.title || achievement.title}
              </Text>

              <Text
                style={[
                  styles.achievementDescription,
                  {
                    color: colors.textSecondary,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {language === "he" && achievement.description
                  ? achievement.description
                  : achievement.description || achievement.description}
              </Text>

              <View style={styles.achievementMeta}>
                <Text style={[styles.rarityBadge, { color: rarityColor }]}>
                  {t(
                    `achievements.rarity.${achievement.rarity.toLowerCase()}`
                  ) || achievement.rarity}
                </Text>

                {achievement.unlocked && (
                  <Text style={[styles.xpReward, { color: colors.primary }]}>
                    +{achievement.xpReward} {t("achievements.xpReward") || "XP"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {!achievement.unlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: rarityColor,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: colors.textSecondary }]}
              >
                {achievement.progress}/{achievement.maxProgress || 1}
              </Text>
            </View>
          )}

          {achievement.unlocked && achievement.unlockedDate && (
            <Text
              style={[styles.unlockedDate, { color: colors.textSecondary }]}
            >
              {t("achievements.unlockedOn") || "Unlocked on"}{" "}
              {new Date(achievement.unlockedDate).toLocaleDateString()}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderPreviewAchievements = () => {
    const previewAchievements = achievements.slice(0, 3);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.previewContainer}
      >
        {previewAchievements.map((achievement, index) => (
          <View key={achievement.id} style={styles.previewCard}>
            <View
              style={[
                styles.previewIcon,
                {
                  backgroundColor: achievement.unlocked
                    ? getRarityColor(achievement.rarity) + "20"
                    : colors.surface,
                },
              ]}
            >
              {getAchievementIcon(
                achievement.icon,
                20,
                achievement.unlocked
                  ? getRarityColor(achievement.rarity)
                  : colors.textSecondary
              )}
            </View>
            <Text
              style={[
                styles.previewTitle,
                {
                  color: achievement.unlocked
                    ? colors.text
                    : colors.textSecondary,
                  textAlign: "center",
                },
              ]}
            >
              {language === "he" && achievement.title
                ? achievement.title
                : achievement.title || achievement.title}
            </Text>
            {achievement.unlocked && (
              <View style={styles.checkmark}>
                <Text style={{ color: colors.success }}>✓</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🏆 {t("achievements.title") || "Achievements"}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            {unlockedAchievements.length}/{achievements.length}{" "}
            {t("achievements.unlocked") || "unlocked"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.seeAllButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={[styles.seeAllText, { color: colors.onPrimary }]}>
            {t("common.view_all") || "View All"}
          </Text>
          <ChevronRight size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {renderPreviewAchievements()}

      {/* Full Achievements Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("achievements.title") || "Achievements"}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === category.key
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    {
                      color:
                        selectedCategory === category.key
                          ? colors.onPrimary
                          : colors.text,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.modalContent}>
            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {t("achievements.unlocked") || "Unlocked"} (
                  {unlockedAchievements.length})
                </Text>
                {unlockedAchievements.map(renderAchievementCard)}
              </>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {t("achievements.locked") || "Locked"} (
                  {lockedAchievements.length})
                </Text>
                {lockedAchievements.map(renderAchievementCard)}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  previewContainer: {
    marginBottom: 8,
  },
  previewCard: {
    width: 100,
    alignItems: "center",
    marginRight: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  achievementCard: {
    marginBottom: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementGradient: {
    borderRadius: 16,
    padding: 18,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  achievementMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityBadge: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  xpReward: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  unlockedDate: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
