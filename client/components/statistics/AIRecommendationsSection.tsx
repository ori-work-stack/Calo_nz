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
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Info,
  Sparkles,
  Zap,
  ArrowRight,
  Eye,
  Award,
} from "lucide-react-native";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  SlideInRight,
  SlideInLeft,
  BounceIn,
  ZoomIn,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

const { width } = Dimensions.get("window");

interface AIRecommendation {
  id: string;
  date: string;
  recommendations: any; // Made more flexible to handle different data structures
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
  const configs = {
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

// Helper function to extract recommendations from various data structures
const extractRecommendationsData = (recData: any) => {
  console.log("🔍 Raw recommendation data:", JSON.stringify(recData, null, 2));

  // If recData is null or undefined, return empty structure
  if (!recData) {
    return {
      nutrition_tips: [],
      meal_suggestions: [],
      goal_adjustments: [],
      behavioral_insights: [],
    };
  }

  // Handle different possible data structures
  let extractedData = {
    nutrition_tips: [],
    meal_suggestions: [],
    goal_adjustments: [],
    behavioral_insights: [],
  };

  // Try to extract data from various possible structures
  if (typeof recData === "object") {
    // Direct structure (what the component originally expected)
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

    // Alternative structures - maybe the data is nested differently
    if (recData.data) {
      return extractRecommendationsData(recData.data);
    }

    // Maybe it's an array of recommendations
    if (Array.isArray(recData)) {
      // If it's an array, treat each item as a tip and categorize them
      extractedData.nutrition_tips = recData.slice(
        0,
        Math.ceil(recData.length / 2)
      );
      extractedData.behavioral_insights = recData.slice(
        Math.ceil(recData.length / 2)
      );
    }

    // Maybe the structure has different field names
    Object.keys(recData).forEach((key) => {
      const value = recData[key];
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "string"
      ) {
        // Try to map based on key names
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
          // Default to behavioral insights if we can't categorize
          extractedData.behavioral_insights = [
            ...extractedData.behavioral_insights,
            ...value,
          ];
        }
      }
    });
  }

  // If all arrays are still empty, check if there's actual data that we can use
  const allEmpty =
    extractedData.nutrition_tips.length === 0 &&
    extractedData.meal_suggestions.length === 0 &&
    extractedData.goal_adjustments.length === 0 &&
    extractedData.behavioral_insights.length === 0;

  if (allEmpty && recData && typeof recData === "object") {
    // Try to extract any string values as general recommendations
    const allValues: string[] = [];
    const extractStrings = (obj: any, path: string = "") => {
      if (typeof obj === "string" && obj.trim().length > 10) {
        allValues.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => extractStrings(item, path));
      } else if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          extractStrings(value, path ? `${path}.${key}` : key);
        });
      }
    };

    extractStrings(recData);

    if (allValues.length > 0) {
      // Distribute the found strings across categories
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

  console.log("✅ Extracted recommendation data:", extractedData);
  return extractedData;
};

export const AIRecommendationsSection: React.FC<
  AIRecommendationsSectionProps
> = ({ recommendations = [], period }) => {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<AIRecommendation | null>(null);

  // Debug logging
  console.log("🚀 AIRecommendationsSection received:", {
    recommendationsLength: recommendations.length,
    period,
    firstRecommendation: recommendations[0]
      ? {
          id: recommendations[0].id,
          date: recommendations[0].date,
          recommendationsType: typeof recommendations[0].recommendations,
          recommendationsKeys: recommendations[0].recommendations
            ? Object.keys(recommendations[0].recommendations)
            : "none",
        }
      : "none",
  });

  const filteredRecommendations = useMemo(() => {
    if (!Array.isArray(recommendations)) {
      console.warn(
        "AIRecommendationsSection: recommendations prop is not an array:",
        recommendations
      );
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

    const filtered = recommendations
      .filter((rec) => new Date(rec.date) >= filterDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log("🔢 Filtered recommendations:", filtered.length);
    return filtered;
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

  const renderFullRecommendationsList = () => {
    return (
      <ScrollView
        style={styles.fullListContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.fullListContent}
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
            allTips.push(
              `AI Analysis from ${new Date(
                recommendation.date
              ).toLocaleDateString()}`,
              `Priority: ${recommendation.priority_level.toUpperCase()}`,
              `Confidence: ${Math.round(
                (recommendation.confidence_score || 0) * 100
              )}%`
            );
          }

          return (
            <Animated.View
              key={recommendation.id}
              entering={FadeInUp.delay(index * 100)}
              style={[
                styles.cleanRecommendationCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityConfig.colors[0] },
                    ]}
                  />
                  <Text style={[styles.cardDate, { color: colors.text }]}>
                    {new Date(recommendation.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Star size={12} color={colors.warning} />
                  <Text
                    style={[
                      styles.confidenceScore,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {Math.round((recommendation.confidence_score || 0) * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  AI Insights & Recommendations
                </Text>
                <View style={styles.tipsContainer}>
                  {allTips.map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipRow}>
                      <View
                        style={[
                          styles.tipBullet,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.tipText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  };

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
      allTips.push(
        `AI Analysis from ${new Date(
          latestRecommendation.date
        ).toLocaleDateString()}`,
        `Priority: ${latestRecommendation.priority_level.toUpperCase()}`,
        `Confidence: ${Math.round(
          (latestRecommendation.confidence_score || 0) * 100
        )}%`
      );
    }

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
          {/* Header */}
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

          {/* AI Badge */}
          <LinearGradient
            colors={[colors.primary, colors.emerald600]}
            style={styles.previewAiBadge}
          >
            <Sparkles size={8} color="white" />
            <Text style={styles.previewAiText}>AI INSIGHTS</Text>
          </LinearGradient>

          {/* Content Preview */}
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

          {/* Footer */}
          <View
            style={[styles.previewFooter, { borderTopColor: colors.border }]}
          >
            <View style={styles.previewDateContainer}>
              <Clock size={10} color={colors.textTertiary} />
              <Text
                style={[styles.previewDateText, { color: colors.textTertiary }]}
              >
                {new Date(latestRecommendation.date).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )}
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

    return (
      <ScrollView
        style={[
          styles.fullRecommendationContainer,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.fullHeader}>
          <LinearGradient
            colors={priorityConfig.colors}
            style={styles.fullHeaderGradient}
          >
            <View style={styles.fullHeaderContent}>
              <Text style={styles.fullHeaderDate}>
                {new Date(recommendation.date).toLocaleDateString("en-US", {
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

        {/* Sections */}
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

  // Apple-style list with refined design
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

        // Fallback if no tips - show meaningful information
        if (allTips.length === 0) {
          allTips.push(
            `AI Analysis completed on ${new Date(
              recommendation.date
            ).toLocaleDateString()}`,
            `Priority Level: ${recommendation.priority_level.toUpperCase()}`,
            `Confidence Score: ${Math.round(
              (recommendation.confidence_score || 0) * 100
            )}%`,
            "Detailed insights are being processed"
          );
        }

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
              {/* Card Header with floating priority badge */}
              <View style={styles.newCardHeader}>
                <View style={styles.newCardTopRow}>
                  <View style={styles.newCardDateSection}>
                    <Text style={[styles.newCardDay, { color: colors.text }]}>
                      {new Date(recommendation.date).toLocaleDateString(
                        "en-US",
                        {
                          day: "numeric",
                        }
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.newCardMonth,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(recommendation.date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                        }
                      )}
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

                {/* AI Badge and Confidence Score */}
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

              {/* Main Content Preview */}
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

              {/* Card Footer */}
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
                    {new Date(recommendation.date).toLocaleDateString("en-US", {
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

  return (
    <Animated.View
      entering={FadeInUp}
      style={[styles.section, { shadowColor: colors.primary }]}
    >
      <LinearGradient
        colors={[colors.surface, colors.background, colors.surface]}
        style={styles.sectionGradient}
      >
        {/* Clean Header */}
        <Animated.View entering={SlideInRight.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View
                style={[
                  styles.titleIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Brain size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
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

        {/* Preview */}
        {renderRecommendationPreview()}
      </LinearGradient>

      {/* Full Recommendations Modal with Apple-style design */}
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
          {/* Apple-style modal header */}
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

          {/* Enhanced list with Apple design */}
          {renderAppleStyleList()}
        </View>
      </Modal>

      {/* Individual Recommendation Modal */}
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
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
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
    gap: 10,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: "500",
  },
  headerViewAllButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  headerViewAllGradient: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  // Full Recommendations List
  fullListContainer: {
    flex: 1,
  },
  fullListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cleanRecommendationCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: "600",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  confidenceScore: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  tipsContainer: {
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },

  // Preview Container
  previewContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 8,
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
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  previewPriorityText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  previewConfidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewConfidenceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  previewViewAllButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  previewAiText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.8,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  previewTipBulletInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  previewTipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  previewMoreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 32,
    marginTop: 4,
  },
  previewMoreText: {
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: "500",
  },
  previewViewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewViewAllText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },

  // Apple-style Modal Header
  appleModalHeader: {
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  appleModalHandle: {
    width: 36,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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

  // NEW LIST DESIGN STYLES
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
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  newCardAiText: {
    fontSize: 9,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  newCardConfidence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newCardConfidenceText: {
    fontSize: 10,
    fontWeight: "500",
  },
  newCardContent: {
    marginBottom: 16,
  },
  newCardPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  newCardTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingRight: 8,
  },
  newCardTipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    marginRight: 10,
    flexShrink: 0,
  },
  newCardTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  newCardMoreSection: {
    marginTop: 4,
    paddingLeft: 14,
  },
  newCardMoreText: {
    fontSize: 11,
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
    gap: 4,
  },
  newCardFooterTime: {
    fontSize: 10,
    fontWeight: "500",
  },
  newCardFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newCardFooterAction: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Individual Modal
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Full Recommendation
  fullRecommendationContainer: {
    flex: 1,
  },
  fullHeader: {
    marginBottom: 20,
  },
  fullHeaderGradient: {
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  fullHeaderBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  fullHeaderScore: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  fullHeaderScoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },

  // Sections
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  recommendationSection: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  sectionContent: {
    gap: 10,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  itemBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  itemBulletInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "white",
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
});
