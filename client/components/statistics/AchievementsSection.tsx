import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
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
  Lock,
} from "lucide-react-native";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

interface LocalizedString {
  en: string;
  he: string;
}

interface Achievement {
  id: string;
  title: string | LocalizedString;
  description: string | LocalizedString;
  icon: string;
  rarity: string;
  category: string;
  unlocked: boolean;
  progress: number;
  maxProgress?: number;
  xpReward: number;
  unlockedDate?: string;
}

const getLocalizedText = (
  text: string | LocalizedString,
  locale: string = "en"
): string => {
  if (typeof text === "string") return text;
  return text[locale as keyof LocalizedString] || text.en;
};

interface AchievementsSectionProps {
  achievements: Achievement[];
  period: "today" | "week" | "month";
  locale?: string;
}

const getAchievementIcon = (
  iconName: string,
  size: number = 20,
  color: string = "#16A085"
) => {
  const iconProps = { size, color, strokeWidth: 2.5 };

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
      return "#FF9500";
    case "EPIC":
      return "#AF52DE";
    case "RARE":
      return "#007AFF";
    case "UNCOMMON":
      return "#34C759";
    case "COMMON":
    default:
      return "#8E8E93";
  }
};

const getRarityGradient = (rarity: string): readonly [string, string] => {
  switch (rarity.toUpperCase()) {
    case "LEGENDARY":
      return ["#FFF4E5", "#FFE5CC"] as const;
    case "EPIC":
      return ["#F5EFFF", "#EBE0FF"] as const;
    case "RARE":
      return ["#E5F2FF", "#CCE5FF"] as const;
    case "UNCOMMON":
      return ["#E5F9ED", "#CCF3DB"] as const;
    case "COMMON":
    default:
      return ["#F2F2F7", "#E5E5EA"] as const;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AchievementPreviewCard: React.FC<{
  achievement: Achievement;
  index: number;
  onPress: () => void;
  locale?: string;
}> = ({ achievement, index, onPress, locale = "en" }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const rarityColor = getRarityColor(achievement.rarity);
  const gradientColors = getRarityGradient(achievement.rarity);
  const lockedGradient = ["#F8F8F8", "#F2F2F7"] as const;

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 80).springify()}
      style={[styles.previewCard, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <LinearGradient
        colors={achievement.unlocked ? gradientColors : lockedGradient}
        style={styles.previewGradient}
      >
        <View
          style={[
            styles.previewIconContainer,
            {
              backgroundColor: achievement.unlocked
                ? rarityColor + "20"
                : "#E5E5EA",
            },
          ]}
        >
          {achievement.unlocked ? (
            getAchievementIcon(achievement.icon, 32, rarityColor)
          ) : (
            <Lock size={28} color="#C7C7CC" strokeWidth={2.5} />
          )}
        </View>

        {achievement.unlocked && (
          <Animated.View
            entering={ZoomIn.delay(index * 80 + 200)}
            style={styles.checkmarkBadge}
          >
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </Animated.View>
        )}

        <Text
          style={[
            styles.previewTitle,
            { color: achievement.unlocked ? "#000000" : "#A0A0A0" },
          ]}
          numberOfLines={2}
        >
          {getLocalizedText(achievement.title, locale)}
        </Text>

        {achievement.unlocked && (
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const AchievementFullCard: React.FC<{
  achievement: Achievement;
  index: number;
  locale?: string;
}> = ({ achievement, index, locale = "en" }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const rarityColor = getRarityColor(achievement.rarity);
  const gradientColors = getRarityGradient(achievement.rarity);
  const lockedGradient = ["#FAFAFA", "#F2F2F7"] as const;
  const progressPercentage =
    (achievement.progress / (achievement.maxProgress || 1)) * 100;

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 60).springify()}
      style={[styles.fullCard, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <LinearGradient
        colors={achievement.unlocked ? gradientColors : lockedGradient}
        style={styles.fullCardGradient}
      >
        <View style={styles.fullCardContent}>
          <View
            style={[
              styles.fullIconContainer,
              {
                backgroundColor: achievement.unlocked
                  ? rarityColor + "20"
                  : "#E5E5EA",
              },
            ]}
          >
            {achievement.unlocked ? (
              getAchievementIcon(achievement.icon, 36, rarityColor)
            ) : (
              <Lock size={32} color="#C7C7CC" strokeWidth={2.5} />
            )}
          </View>

          <View style={styles.fullCardInfo}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.fullCardTitle,
                  { color: achievement.unlocked ? "#000000" : "#A0A0A0" },
                ]}
                numberOfLines={1}
              >
                {getLocalizedText(achievement.title, locale)}
              </Text>
              {achievement.unlocked && (
                <View
                  style={[
                    styles.xpBadge,
                    { backgroundColor: rarityColor + "15" },
                  ]}
                >
                  <Sparkles size={12} color={rarityColor} strokeWidth={2.5} />
                  <Text style={[styles.xpText, { color: rarityColor }]}>
                    +{achievement.xpReward}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.fullCardDescription,
                { color: achievement.unlocked ? "#3C3C43" : "#A0A0A0" },
              ]}
              numberOfLines={2}
            >
              {getLocalizedText(achievement.description, locale)}
            </Text>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.rarityBadge,
                  { backgroundColor: rarityColor + "15" },
                ]}
              >
                <Text style={[styles.rarityText, { color: rarityColor }]}>
                  {achievement.rarity}
                </Text>
              </View>

              {achievement.unlocked && achievement.unlockedDate && (
                <Text style={styles.dateText}>
                  {new Date(achievement.unlockedDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </Text>
              )}
            </View>

            {!achievement.unlocked && achievement.maxProgress && (
              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: rarityColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            )}
          </View>
        </View>

        {achievement.unlocked && (
          <View style={styles.fullCardCheckmark}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  period,
  locale = "en",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: "All" },
    { key: "MILESTONE", label: "Milestones" },
    { key: "STREAK", label: "Streaks" },
    { key: "GOAL", label: "Goals" },
    { key: "SPECIAL", label: "Special" },
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

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalXP = achievements.reduce(
    (sum, a) => sum + (a.unlocked ? a.xpReward : 0),
    0
  );
  const completionPercentage = Math.round(
    (totalUnlocked / achievements.length) * 100
  );
  const { colors } = useTheme();
  return (
    <>
      <Animated.View
        entering={FadeIn.duration(600)}
        style={[
          styles.section,
          ,
          {
            backgroundColor: colors.background,
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 20,
            borderRadius: 24,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionSubtitle}>
              {totalUnlocked} of {achievements.length} unlocked
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllButtonPressed,
            ]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color={colors.emerald500} strokeWidth={3} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewScrollContent}
          decelerationRate="fast"
          snapToInterval={116}
        >
          {achievements.slice(0, 8).map((achievement, index) => (
            <AchievementPreviewCard
              key={achievement.id}
              achievement={achievement}
              index={index}
              onPress={() => setShowModal(true)}
              locale={locale}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView intensity={20} tint="light" style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <View>
                <Text style={styles.modalTitle}>Achievements</Text>
                <Text style={styles.modalSubtitle}>
                  Track your progress and milestones
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
                onPress={() => setShowModal(false)}
              >
                <X size={22} color="#000000" strokeWidth={2.5} />
              </Pressable>
            </View>
          </BlurView>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Trophy size={24} color="#FF9500" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>{totalUnlocked}</Text>
                  <Text style={styles.statLabel}>Unlocked</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Sparkles size={24} color="#AF52DE" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>{totalXP}</Text>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Target size={24} color="#007AFF" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>{completionPercentage}%</Text>
                  <Text style={styles.statLabel}>Complete</Text>
                </View>
              </View>

              <View style={styles.overallProgressCard}>
                <Text style={styles.overallProgressLabel}>
                  Overall Progress
                </Text>
                <View style={styles.overallProgressBar}>
                  <LinearGradient
                    colors={["#007AFF", "#00C7BE"] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.overallProgressFill,
                      { width: `${completionPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.overallProgressText}>
                  {totalUnlocked} of {achievements.length} achievements unlocked
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
              style={styles.categoryScroll}
            >
              {categories.map((category) => (
                <Pressable
                  key={category.key}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    selectedCategory === category.key &&
                      styles.categoryChipActive,
                    pressed && styles.categoryChipPressed,
                  ]}
                  onPress={() => setSelectedCategory(category.key)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.key &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {unlockedAchievements.length > 0 && (
              <View style={styles.achievementsSection}>
                <View style={styles.sectionTitleContainer}>
                  <View style={styles.sectionTitleIcon}>
                    <Star size={20} color="#34C759" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.categoryTitle}>
                    Unlocked ({unlockedAchievements.length})
                  </Text>
                </View>
                <View style={styles.achievementGrid}>
                  {unlockedAchievements.map((achievement, index) => (
                    <AchievementFullCard
                      key={achievement.id}
                      achievement={achievement}
                      index={index}
                      locale={locale}
                    />
                  ))}
                </View>
              </View>
            )}

            {lockedAchievements.length > 0 && (
              <View style={styles.achievementsSection}>
                <View style={styles.sectionTitleContainer}>
                  <View style={styles.sectionTitleIcon}>
                    <Lock size={20} color="#8E8E93" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.categoryTitle}>
                    Locked ({lockedAchievements.length})
                  </Text>
                </View>
                <View style={styles.achievementGrid}>
                  {lockedAchievements.map((achievement, index) => (
                    <AchievementFullCard
                      key={achievement.id}
                      achievement={achievement}
                      index={index + unlockedAchievements.length}
                      locale={locale}
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: "",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    fontSize: isTablet ? 16 : 15,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  viewAllButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.96 }],
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14b8a6",
  },
  previewScrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
  },
  previewCard: {
    width: 104,
    height: 130,
  },
  previewGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  previewIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  checkmarkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#34C759",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  modalHeader: {
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: isTablet ? 34 : 32,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -1,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "600",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.94 }],
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 40,
  },
  statsContainer: {
    padding: 20,
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: isTablet ? 28 : 26,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  overallProgressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  overallProgressLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  overallProgressBar: {
    height: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  overallProgressFill: {
    height: "100%",
    borderRadius: 6,
  },
  overallProgressText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryChipActive: {
    backgroundColor: "#007AFF",
  },
  categoryChipPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  categoryTitle: {
    fontSize: isTablet ? 24 : 22,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.5,
  },
  achievementGrid: {
    gap: 12,
  },
  fullCard: {
    width: "100%",
  },
  fullCardGradient: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  fullCardContent: {
    flexDirection: "row",
    padding: 20,
  },
  fullIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  fullCardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  fullCardTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "800",
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.3,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  xpText: {
    fontSize: 13,
    fontWeight: "800",
  },
  fullCardDescription: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  progressSection: {
    marginTop: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "700",
    textAlign: "right",
  },
  fullCardCheckmark: {
    position: "absolute",
    top: 14,
    right: 14,
  },
});
