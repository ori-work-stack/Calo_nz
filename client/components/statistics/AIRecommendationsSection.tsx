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
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  ChevronRight,
  X,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  ArrowRight,
  Eye,
  Award,
} from "lucide-react-native";
import Animated, {
  FadeInUp,
  FadeInDown,
  SlideInRight,
  BounceIn,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

const { width } = Dimensions.get("window");

interface AIRecommendation {
  id: string;
  date: string;
  recommendations: any;
  priority_level: "low" | "medium" | "high";
  confidence_score: number;
  is_read: boolean;
  created_at: string;
  based_on?: any;
  user_id?: string;
}

interface AIRecommendationsSectionProps {
  recommendations?: AIRecommendation[];
  period: "today" | "week" | "month";
  colors: {
    primary: string;
    surface: string;
    background: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    card: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    emerald400: string;
    emerald500: string;
    emerald600: string;
    emerald700: string;
    muted: string;
  };
}

interface ExtractedRecommendations {
  nutrition_tips: string[];
  meal_suggestions: string[];
  goal_adjustments: string[];
  behavioral_insights: string[];
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const getPriorityConfig = (priority: string, colors: any) => {
  switch (priority) {
    case "high":
      return {
        colors: [colors.error, "#FF5252", "#FF1744"],
        shadowColor: colors.error,
        icon: AlertCircle,
        glow: `${colors.error}30`,
      };
    case "medium":
      return {
        colors: [colors.warning, "#FF9800", "#F57C00"],
        shadowColor: colors.warning,
        icon: Info,
        glow: `${colors.warning}30`,
      };
    case "low":
      return {
        colors: [colors.success, colors.emerald500, colors.emerald600],
        shadowColor: colors.success,
        icon: CheckCircle,
        glow: `${colors.success}30`,
      };
    default:
      return {
        colors: [colors.textSecondary, colors.muted, colors.textTertiary],
        shadowColor: colors.textSecondary,
        icon: Info,
        glow: `${colors.textSecondary}30`,
      };
  }
};

const getRecommendationConfig = (type: string, colors: any) => {
  const configs: Record<string, any> = {
    nutrition_tips: {
      icon: Lightbulb,
      gradient: [colors.emerald400, colors.emerald500, colors.emerald600],
      title: "Smart Nutrition",
    },
    meal_suggestions: {
      icon: Target,
      gradient: [colors.success, colors.emerald500, colors.emerald600],
      title: "Meal Ideas",
    },
    goal_adjustments: {
      icon: TrendingUp,
      gradient: [colors.info, colors.primary, colors.emerald700],
      title: "Goal Optimization",
    },
    behavioral_insights: {
      icon: Brain,
      gradient: [colors.primary, colors.emerald600, colors.emerald700],
      title: "Behavior Analysis",
    },
  };
  return configs[type] || configs.nutrition_tips;
};

const extractRecommendationsData = (recData: any): ExtractedRecommendations => {
  if (!recData) {
    return {
      nutrition_tips: [],
      meal_suggestions: [],
      goal_adjustments: [],
      behavioral_insights: [],
    };
  }

  let extractedData: ExtractedRecommendations = {
    nutrition_tips: [],
    meal_suggestions: [],
    goal_adjustments: [],
    behavioral_insights: [],
  };

  if (typeof recData === "object") {
    if (Array.isArray(recData.nutrition_tips)) {
      extractedData.nutrition_tips = recData.nutrition_tips;
    }
    if (Array.isArray(recData.meal_suggestions)) {
      extractedData.meal_suggestions = recData.meal_suggestions;
    }
    if (Array.isArray(recData.goal_adjustments)) {
      extractedData.goal_adjustments = recData.goal_adjustments;
    }
    if (Array.isArray(recData.behavioral_insights)) {
      extractedData.behavioral_insights = recData.behavioral_insights;
    }

    if (recData.data) {
      return extractRecommendationsData(recData.data);
    }

    if (Array.isArray(recData)) {
      extractedData.nutrition_tips = recData.slice(
        0,
        Math.ceil(recData.length / 2)
      );
      extractedData.behavioral_insights = recData.slice(
        Math.ceil(recData.length / 2)
      );
    }

    Object.keys(recData).forEach((key) => {
      const value = recData[key];
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "string"
      ) {
        if (
          key.toLowerCase().includes("nutrition") ||
          key.toLowerCase().includes("food") ||
          key.toLowerCase().includes("diet")
        ) {
          extractedData.nutrition_tips = value;
        } else if (
          key.toLowerCase().includes("meal") ||
          key.toLowerCase().includes("recipe")
        ) {
          extractedData.meal_suggestions = value;
        } else if (
          key.toLowerCase().includes("goal") ||
          key.toLowerCase().includes("target")
        ) {
          extractedData.goal_adjustments = value;
        } else if (
          key.toLowerCase().includes("behavior") ||
          key.toLowerCase().includes("insight") ||
          key.toLowerCase().includes("analysis")
        ) {
          extractedData.behavioral_insights = value;
        } else {
          extractedData.behavioral_insights = [
            ...extractedData.behavioral_insights,
            ...value,
          ];
        }
      }
    });
  }

  const allEmpty =
    extractedData.nutrition_tips.length === 0 &&
    extractedData.meal_suggestions.length === 0 &&
    extractedData.goal_adjustments.length === 0 &&
    extractedData.behavioral_insights.length === 0;

  if (allEmpty && recData && typeof recData === "object") {
    const allValues: string[] = [];
    const extractStrings = (obj: any) => {
      if (typeof obj === "string" && obj.trim().length > 10) {
        allValues.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => extractStrings(item));
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach((value) => {
          extractStrings(value);
        });
      }
    };

    extractStrings(recData);

    if (allValues.length > 0) {
      const quarter = Math.ceil(allValues.length / 4);
      extractedData.nutrition_tips = allValues.slice(0, quarter);
      extractedData.meal_suggestions = allValues.slice(quarter, quarter * 2);
      extractedData.goal_adjustments = allValues.slice(
        quarter * 2,
        quarter * 3
      );
      extractedData.behavioral_insights = allValues.slice(quarter * 3);
    }
  }

  return extractedData;
};

export const AIRecommendationsSection: React.FC<
  AIRecommendationsSectionProps
> = ({ recommendations = [], period }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<AIRecommendation | null>(null);
  const { colors } = useTheme();
  const filteredRecommendations = useMemo(() => {
    if (!Array.isArray(recommendations)) {
      return [];
    }

    const now = new Date();
    const filterDate = new Date();

    switch (period) {
      case "today":
        filterDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setDate(now.getDate() - 30);
        break;
    }

    return recommendations
      .filter((rec) => new Date(rec.date) >= filterDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [recommendations, period]);

  const latestRecommendation = filteredRecommendations[0];

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInUp.delay(300)}
      style={[styles.emptyState, { backgroundColor: colors.card }]}
    >
      <LinearGradient
        colors={[`${colors.primary}1A`, `${colors.emerald500}0D`]}
        style={styles.emptyGradient}
      >
        <Animated.View entering={BounceIn.delay(500)}>
          <Brain size={48} color={colors.primary} />
        </Animated.View>
        <Animated.Text
          entering={FadeInUp.delay(700)}
          style={[styles.emptyTitle, { color: colors.text }]}
        >
          AI Learning Mode
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(900)}
          style={[styles.emptySubtitle, { color: colors.textSecondary }]}
        >
          Keep tracking your meals and activities.{"\n"}AI recommendations will
          appear here soon!
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderRecommendationPreview = () => {
    if (!latestRecommendation) {
      return renderEmptyState();
    }

    const priorityConfig = getPriorityConfig(
      latestRecommendation.priority_level,
      colors
    );
    const extractedRecs = extractRecommendationsData(
      latestRecommendation.recommendations
    );
    const allTips = [
      ...extractedRecs.nutrition_tips,
      ...extractedRecs.meal_suggestions,
      ...extractedRecs.goal_adjustments,
      ...extractedRecs.behavioral_insights,
    ];

    if (allTips.length === 0) {
      const recDate = new Date(latestRecommendation.date);
      allTips.push(
        `AI Analysis from ${recDate.toLocaleDateString()}`,
        `Priority: ${latestRecommendation.priority_level.toUpperCase()}`,
        `Confidence: ${Math.round(
          (latestRecommendation.confidence_score || 0) * 100
        )}%`
      );
    }

    const recDate = new Date(latestRecommendation.date);

    return (
      <TouchableOpacity
        style={[styles.previewContainer, { backgroundColor: colors.surface }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={[colors.surface, colors.background]}
          style={styles.previewGradient}
        >
          <View style={styles.previewHeader}>
            <View style={styles.previewHeaderLeft}>
              <LinearGradient
                colors={priorityConfig.colors}
                style={styles.previewPriorityBadge}
              >
                <priorityConfig.icon size={12} color="white" />
                <Text style={styles.previewPriorityText}>
                  {latestRecommendation.priority_level.toUpperCase()}
                </Text>
              </LinearGradient>

              <View style={styles.previewConfidenceContainer}>
                <Star size={12} color={colors.warning} />
                <Text
                  style={[
                    styles.previewConfidenceText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {Math.round(
                    (latestRecommendation.confidence_score || 0) * 100
                  )}
                  %
                </Text>
              </View>
            </View>

            <View style={styles.previewViewAllButton}>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          </View>

          <LinearGradient
            colors={[colors.primary, colors.emerald600]}
            style={styles.previewAiBadge}
          >
            <Sparkles size={8} color="white" />
            <Text style={styles.previewAiText}>AI INSIGHTS</Text>
          </LinearGradient>

          <View style={styles.previewContent}>
            {allTips.slice(0, 2).map((tip, index) => (
              <View key={index} style={styles.previewTipRow}>
                <LinearGradient
                  colors={priorityConfig.colors}
                  style={styles.previewTipBullet}
                >
                  <View style={styles.previewTipBulletInner} />
                </LinearGradient>
                <Text
                  style={[styles.previewTipText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {tip}
                </Text>
              </View>
            ))}

            {allTips.length > 2 && (
              <View style={styles.previewMoreIndicator}>
                <Text
                  style={[styles.previewMoreText, { color: colors.primary }]}
                >
                  +{allTips.length - 2} more insights
                </Text>
                <ArrowRight size={12} color={colors.primary} />
              </View>
            )}
          </View>

          <View
            style={[styles.previewFooter, { borderTopColor: colors.border }]}
          >
            <View style={styles.previewDateContainer}>
              <Clock size={10} color={colors.textTertiary} />
              <Text
                style={[styles.previewDateText, { color: colors.textTertiary }]}
              >
                {recDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.previewViewAllContainer}>
              <Text
                style={[styles.previewViewAllText, { color: colors.primary }]}
              >
                View All
              </Text>
              <Eye size={12} color={colors.primary} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderAppleStyleList = () => (
    <ScrollView
      style={[styles.newListContainer, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.newListContent}
    >
      {filteredRecommendations.map((recommendation, index) => {
        const priorityConfig = getPriorityConfig(
          recommendation.priority_level,
          colors
        );
        const extractedRecs = extractRecommendationsData(
          recommendation.recommendations
        );
        const allTips = [
          ...extractedRecs.nutrition_tips,
          ...extractedRecs.meal_suggestions,
          ...extractedRecs.goal_adjustments,
          ...extractedRecs.behavioral_insights,
        ];

        if (allTips.length === 0) {
          const recDate = new Date(recommendation.date);
          allTips.push(
            `AI Analysis completed on ${recDate.toLocaleDateString()}`,
            `Priority Level: ${recommendation.priority_level.toUpperCase()}`,
            `Confidence Score: ${Math.round(
              (recommendation.confidence_score || 0) * 100
            )}%`,
            "Detailed insights are being processed"
          );
        }

        const recDate = new Date(recommendation.date);

        return (
          <Animated.View
            key={recommendation.id}
            entering={FadeInUp.delay(index * 100)}
            style={[styles.newListCard, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              onPress={() => setSelectedRecommendation(recommendation)}
              style={styles.newListCardTouchable}
              activeOpacity={0.7}
            >
              <View style={styles.newCardHeader}>
                <View style={styles.newCardTopRow}>
                  <View style={styles.newCardDateSection}>
                    <Text style={[styles.newCardDay, { color: colors.text }]}>
                      {recDate.toLocaleDateString(undefined, {
                        day: "numeric",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.newCardMonth,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {recDate.toLocaleDateString(undefined, {
                        month: "short",
                      })}
                    </Text>
                  </View>

                  <LinearGradient
                    colors={priorityConfig.colors}
                    style={styles.newCardPriorityFloat}
                  >
                    <priorityConfig.icon size={12} color="white" />
                    <Text style={styles.newCardPriorityText}>
                      {recommendation.priority_level.charAt(0).toUpperCase() +
                        recommendation.priority_level.slice(1)}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.newCardBadgeRow}>
                  <LinearGradient
                    colors={[colors.primary, colors.emerald600]}
                    style={styles.newCardAiBadge}
                  >
                    <Sparkles size={8} color="white" />
                    <Text style={styles.newCardAiText}>AI</Text>
                  </LinearGradient>

                  <View style={styles.newCardConfidence}>
                    <Star size={10} color={colors.warning} />
                    <Text
                      style={[
                        styles.newCardConfidenceText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {Math.round((recommendation.confidence_score || 0) * 100)}
                      % confidence
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.newCardContent}>
                <Text
                  style={[styles.newCardPreviewTitle, { color: colors.text }]}
                >
                  Latest Insights
                </Text>

                {allTips.slice(0, 2).map((tip, tipIndex) => (
                  <View key={tipIndex} style={styles.newCardTipRow}>
                    <View
                      style={[
                        styles.newCardTipDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.newCardTipText,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {tip}
                    </Text>
                  </View>
                ))}

                {allTips.length > 2 && (
                  <View style={styles.newCardMoreSection}>
                    <Text
                      style={[
                        styles.newCardMoreText,
                        { color: colors.primary },
                      ]}
                    >
                      +{allTips.length - 2} more insights
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.newCardFooter,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.newCardFooterLeft}>
                  <Clock size={10} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.newCardFooterTime,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {recDate.toLocaleDateString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <View style={styles.newCardFooterRight}>
                  <Text
                    style={[
                      styles.newCardFooterAction,
                      { color: colors.primary },
                    ]}
                  >
                    View Details
                  </Text>
                  <ChevronRight size={12} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );

  const renderFullRecommendation = (recommendation: AIRecommendation) => {
    const extractedRecs = extractRecommendationsData(
      recommendation.recommendations
    );
    const priorityConfig = getPriorityConfig(
      recommendation.priority_level,
      colors
    );

    const sections = [
      {
        key: "nutrition_tips",
        title: "Smart Nutrition Tips",
        items: extractedRecs.nutrition_tips || [],
        config: getRecommendationConfig("nutrition_tips", colors),
      },
      {
        key: "meal_suggestions",
        title: "Personalized Meal Ideas",
        items: extractedRecs.meal_suggestions || [],
        config: getRecommendationConfig("meal_suggestions", colors),
      },
      {
        key: "goal_adjustments",
        title: "Goal Optimization",
        items: extractedRecs.goal_adjustments || [],
        config: getRecommendationConfig("goal_adjustments", colors),
      },
      {
        key: "behavioral_insights",
        title: "Behavior Analysis",
        items: extractedRecs.behavioral_insights || [],
        config: getRecommendationConfig("behavioral_insights", colors),
      },
    ];

    const recDate = new Date(recommendation.date);

    return (
      <ScrollView
        style={[
          styles.fullRecommendationContainer,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown} style={styles.fullHeader}>
          <LinearGradient
            colors={priorityConfig.colors}
            style={styles.fullHeaderGradient}
          >
            <View style={styles.fullHeaderContent}>
              <Text style={styles.fullHeaderDate}>
                {recDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <View style={styles.fullHeaderMeta}>
                <View style={styles.fullHeaderBadge}>
                  <priorityConfig.icon size={14} color="white" />
                  <Text style={styles.fullHeaderBadgeText}>
                    {recommendation.priority_level.toUpperCase()} PRIORITY
                  </Text>
                </View>
                <View style={styles.fullHeaderScore}>
                  <Award size={14} color="white" />
                  <Text style={styles.fullHeaderScoreText}>
                    {Math.round((recommendation.confidence_score || 0) * 100)}%
                    Confidence
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.sectionsContainer}>
          {sections.map(
            (section, sectionIndex) =>
              section.items.length > 0 && (
                <Animated.View
                  key={section.key}
                  entering={FadeInUp.delay(sectionIndex * 200)}
                  style={[
                    styles.recommendationSection,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.surface, colors.background]}
                    style={styles.sectionGradient}
                  >
                    <View style={styles.sectionHeader}>
                      <LinearGradient
                        colors={section.config.gradient}
                        style={styles.sectionIconContainer}
                      >
                        <section.config.icon size={16} color="white" />
                      </LinearGradient>
                      <View style={styles.sectionTitleContainer}>
                        <Text
                          style={[styles.sectionTitle, { color: colors.text }]}
                        >
                          {section.title}
                        </Text>
                        <Text
                          style={[
                            styles.sectionCount,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {section.items.length} insights
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sectionContent}>
                      {section.items.map((item, itemIndex) => (
                        <Animated.View
                          key={itemIndex}
                          entering={SlideInRight.delay(
                            sectionIndex * 200 + itemIndex * 100
                          )}
                          style={styles.recommendationItem}
                        >
                          <LinearGradient
                            colors={section.config.gradient}
                            style={styles.itemBullet}
                          >
                            <View style={styles.itemBulletInner} />
                          </LinearGradient>
                          <View style={styles.itemContent}>
                            <Text
                              style={[styles.itemText, { color: colors.text }]}
                            >
                              {item}
                            </Text>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  </LinearGradient>
                </Animated.View>
              )
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <Animated.View
      entering={FadeInUp}
      style={[styles.section, { shadowColor: colors.primary }]}
    >
      <LinearGradient
        colors={[colors.surface, colors.background, colors.surface]}
        style={styles.sectionGradient}
      >
        <Animated.View entering={SlideInRight.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View
                style={[
                  styles.titleIcon,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Brain size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitleMain, { color: colors.text }]}>
                  AI Insights
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {filteredRecommendations.length} recommendations
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {renderRecommendationPreview()}
      </LinearGradient>

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
            style={[
              styles.appleModalHeader,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.appleModalHandle} />

            <View style={styles.appleModalHeaderContent}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[
                  styles.appleModalCloseButton,
                  { backgroundColor: colors.card },
                ]}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.appleModalTitleContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.emerald600]}
                  style={styles.appleModalTitleIcon}
                >
                  <Brain size={16} color="white" />
                </LinearGradient>
                <View>
                  <Text
                    style={[styles.appleModalTitle, { color: colors.text }]}
                  >
                    AI Recommendations
                  </Text>
                  <Text
                    style={[
                      styles.appleModalSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {filteredRecommendations.length} insights available
                  </Text>
                </View>
              </View>

              <View style={{ width: 32 }} />
            </View>
          </View>

          {renderAppleStyleList()}
        </View>
      </Modal>

      <Modal
        visible={!!selectedRecommendation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRecommendation(null)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.individualModalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedRecommendation(null)}
              style={styles.individualModalClose}
            >
              <LinearGradient
                colors={[colors.primary, colors.emerald600]}
                style={styles.individualModalCloseGradient}
              >
                <X size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {selectedRecommendation &&
            renderFullRecommendation(selectedRecommendation)}
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionGradient: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleMain: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  emptyState: {
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  previewContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  previewGradient: {
    padding: 20,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewPriorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  previewPriorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  previewConfidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  previewConfidenceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  previewViewAllButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewAiBadge: {
    alignSelf: "flex-start",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  previewAiText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    letterSpacing: 1,
  },
  previewContent: {
    gap: 12,
    marginBottom: 16,
  },
  previewTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  previewTipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  previewTipBulletInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  previewTipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  previewMoreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 34,
    marginTop: 4,
  },
  previewMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  previewDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewDateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  previewViewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewViewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  appleModalHeader: {
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  appleModalHandle: {
    width: 36,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  appleModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  appleModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appleModalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 20,
  },
  appleModalTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appleModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  appleModalSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  newListContainer: {
    flex: 1,
  },
  newListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  newListCard: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  newListCardTouchable: {
    padding: 20,
  },
  newCardHeader: {
    marginBottom: 16,
  },
  newCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  newCardDateSection: {
    alignItems: "center",
  },
  newCardDay: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  newCardMonth: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  newCardPriorityFloat: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  newCardPriorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  newCardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newCardAiBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  newCardAiText: {
    fontSize: 9,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.8,
  },
  newCardConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newCardConfidenceText: {
    fontSize: 11,
    fontWeight: "500",
  },
  newCardContent: {
    marginBottom: 16,
  },
  newCardPreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  newCardTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingRight: 8,
  },
  newCardTipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
    marginRight: 10,
    flexShrink: 0,
  },
  newCardTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  newCardMoreSection: {
    marginTop: 4,
    paddingLeft: 15,
  },
  newCardMoreText: {
    fontSize: 12,
    fontWeight: "600",
  },
  newCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  newCardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  newCardFooterTime: {
    fontSize: 11,
    fontWeight: "500",
  },
  newCardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  newCardFooterAction: {
    fontSize: 12,
    fontWeight: "600",
  },
  individualModalHeader: {
    padding: 16,
    paddingTop: 50,
    alignItems: "flex-end",
  },
  individualModalClose: {
    borderRadius: 16,
    overflow: "hidden",
  },
  individualModalCloseGradient: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  fullRecommendationContainer: {
    flex: 1,
  },
  fullHeader: {
    marginBottom: 20,
  },
  fullHeaderGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  fullHeaderContent: {
    alignItems: "center",
  },
  fullHeaderDate: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  fullHeaderMeta: {
    flexDirection: "row",
    gap: 12,
  },
  fullHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
  },
  fullHeaderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  fullHeaderScore: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
  },
  fullHeaderScoreText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recommendationSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  sectionContent: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  itemBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  itemBulletInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "white",
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
