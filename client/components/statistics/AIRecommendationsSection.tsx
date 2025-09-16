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

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "high":
      return {
        colors: ["#FF6B6B", "#FF5252", "#FF1744"],
        shadowColor: "#FF5252",
        icon: AlertCircle,
        glow: "rgba(255, 107, 107, 0.3)",
      };
    case "medium":
      return {
        colors: ["#FFB74D", "#FF9800", "#F57C00"],
        shadowColor: "#FF9800",
        icon: Info,
        glow: "rgba(255, 183, 77, 0.3)",
      };
    case "low":
      return {
        colors: ["#66BB6A", "#4CAF50", "#388E3C"],
        shadowColor: "#4CAF50",
        icon: CheckCircle,
        glow: "rgba(102, 187, 106, 0.3)",
      };
    default:
      return {
        colors: ["#90A4AE", "#607D8B", "#455A64"],
        shadowColor: "#607D8B",
        icon: Info,
        glow: "rgba(144, 164, 174, 0.3)",
      };
  }
};

const getRecommendationConfig = (type: string) => {
  const configs = {
    nutrition_tips: {
      icon: Lightbulb,
      gradient: ["#FFD54F", "#FFC107", "#FF8F00"],
      title: "Smart Nutrition",
    },
    meal_suggestions: {
      icon: Target,
      gradient: ["#81C784", "#66BB6A", "#4CAF50"],
      title: "Meal Ideas",
    },
    goal_adjustments: {
      icon: TrendingUp,
      gradient: ["#64B5F6", "#42A5F5", "#1976D2"],
      title: "Goal Optimization",
    },
    behavioral_insights: {
      icon: Brain,
      gradient: ["#BA68C8", "#AB47BC", "#8E24AA"],
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

  console.log("✅ Extracted recommendation data:", extractedData);
  return extractedData;
};

export const AIRecommendationsSection: React.FC<
  AIRecommendationsSectionProps
> = ({ recommendations = [], period }) => {
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
    <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyState}>
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.1)", "rgba(255, 107, 107, 0.05)"]}
        style={styles.emptyGradient}
      >
        <Animated.View entering={BounceIn.delay(500)}>
          <Brain size={48} color="#6C63FF" />
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(700)} style={styles.emptyTitle}>
          AI Learning Mode
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(900)}
          style={styles.emptySubtitle}
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

    console.log("🎯 Rendering preview for:", latestRecommendation.id);

    const priorityConfig = getPriorityConfig(
      latestRecommendation.priority_level
    );

    // Use the helper function to extract recommendations
    const extractedRecs = extractRecommendationsData(
      latestRecommendation.recommendations
    );

    // Get all tips from all categories
    const allTips = [
      ...extractedRecs.nutrition_tips,
      ...extractedRecs.meal_suggestions,
      ...extractedRecs.goal_adjustments,
      ...extractedRecs.behavioral_insights,
    ];

    console.log(
      "📝 All tips for preview:",
      allTips.length,
      allTips.slice(0, 2)
    );

    // If no tips found, create fallback content
    if (allTips.length === 0) {
      allTips.push(
        "Your AI assistant is analyzing your patterns",
        "Personalized recommendations are being generated"
      );
    }

    return (
      <Animated.View entering={FadeInUp} style={styles.previewContainer}>
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FF", "#FFFFFF"]}
          style={styles.previewGradient}
        >
          {/* Header with Priority and Confidence */}
          <Animated.View entering={SlideInRight} style={styles.previewHeader}>
            <LinearGradient
              colors={priorityConfig.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priorityBadge}
            >
              <priorityConfig.icon size={12} color="white" />
              <Text style={styles.priorityBadgeText}>
                {latestRecommendation.priority_level.toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.confidenceContainer}>
              <Animated.View entering={ZoomIn.delay(200)}>
                <Star size={14} color="#FFD700" />
              </Animated.View>
              <Text style={styles.confidenceText}>
                {Math.round((latestRecommendation.confidence_score || 0) * 100)}
                %
              </Text>
            </View>
          </Animated.View>

          {/* AI Badge */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.aiBadge}>
            <LinearGradient
              colors={["#6C63FF", "#4F46E5", "#3730A3"]}
              style={styles.aiBadgeGradient}
            >
              <Sparkles size={10} color="white" />
              <Text style={styles.aiBadgeText}>AI POWERED</Text>
            </LinearGradient>
          </Animated.View>

          {/* Preview Content - Show first 2 tips */}
          <View style={styles.previewContent}>
            {allTips.slice(0, 2).map((tip, index) => (
              <Animated.View
                key={index}
                entering={SlideInLeft.delay(400 + index * 100)}
                style={styles.tipPreview}
              >
                <LinearGradient
                  colors={["#6C63FF", "#4F46E5"]}
                  style={styles.tipBullet}
                >
                  <Zap size={6} color="white" />
                </LinearGradient>
                <Text style={styles.tipText} numberOfLines={1}>
                  {tip}
                </Text>
              </Animated.View>
            ))}

            {allTips.length > 2 && (
              <Animated.View
                entering={FadeIn.delay(600)}
                style={styles.moreIndicator}
              >
                <Text style={styles.moreText}>
                  +{allTips.length - 2} more insights
                </Text>
                <ArrowRight size={12} color="#6C63FF" />
              </Animated.View>
            )}
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeInUp.delay(800)}
            style={styles.previewFooter}
          >
            <View style={styles.dateContainer}>
              <Clock size={12} color="#8B5CF6" />
              <Text style={styles.dateText}>
                {new Date(latestRecommendation.date).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </Text>
            </View>

            {filteredRecommendations.length > 1 && (
              <TouchableOpacity
                onPress={() => setShowModal(true)}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Eye size={12} color="#6C63FF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderFullRecommendation = (recommendation: AIRecommendation) => {
    const extractedRecs = extractRecommendationsData(
      recommendation.recommendations
    );
    const priorityConfig = getPriorityConfig(recommendation.priority_level);

    const sections = [
      {
        key: "nutrition_tips",
        title: "Smart Nutrition Tips",
        items: extractedRecs.nutrition_tips || [],
        config: getRecommendationConfig("nutrition_tips"),
      },
      {
        key: "meal_suggestions",
        title: "Personalized Meal Ideas",
        items: extractedRecs.meal_suggestions || [],
        config: getRecommendationConfig("meal_suggestions"),
      },
      {
        key: "goal_adjustments",
        title: "Goal Optimization",
        items: extractedRecs.goal_adjustments || [],
        config: getRecommendationConfig("goal_adjustments"),
      },
      {
        key: "behavioral_insights",
        title: "Behavior Analysis",
        items: extractedRecs.behavioral_insights || [],
        config: getRecommendationConfig("behavioral_insights"),
      },
    ];

    return (
      <ScrollView
        style={styles.fullRecommendationContainer}
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
                  style={styles.recommendationSection}
                >
                  <LinearGradient
                    colors={["#FFFFFF", "#FAFBFF"]}
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
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionCount}>
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
                            <Text style={styles.itemText}>{item}</Text>
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
    <Animated.View entering={FadeInUp} style={styles.section}>
      <LinearGradient
        colors={["#FFFFFF", "#F8F9FF", "#FFFFFF"]}
        style={styles.sectionGradient}
      >
        {/* Compact Header */}
        <Animated.View entering={SlideInRight.delay(100)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={["#6C63FF", "#4F46E5"]}
                style={styles.titleIcon}
              >
                <Brain size={16} color="white" />
              </LinearGradient>
              <View>
                <Text style={styles.sectionTitle}>AI Insights</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredRecommendations.length} recommendations
                </Text>
              </View>
            </View>

            {filteredRecommendations.length > 0 && (
              <AnimatedTouchableOpacity
                entering={ZoomIn.delay(300)}
                style={styles.headerViewAllButton}
                onPress={() => setShowModal(true)}
              >
                <LinearGradient
                  colors={["#6C63FF", "#4F46E5"]}
                  style={styles.headerViewAllGradient}
                >
                  <ChevronRight size={14} color="white" />
                </LinearGradient>
              </AnimatedTouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Preview */}
        {renderRecommendationPreview()}
      </LinearGradient>

      {/* Full Recommendations Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#6C63FF", "#4F46E5"]}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Recommendations</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredRecommendations.map((recommendation, index) => {
              const priorityConfig = getPriorityConfig(
                recommendation.priority_level
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

              // Fallback if no tips
              if (allTips.length === 0) {
                allTips.push("AI insights available for this date");
              }

              return (
                <Animated.View
                  key={recommendation.id}
                  entering={FadeInUp.delay(index * 100)}
                >
                  <TouchableOpacity
                    style={styles.recommendationListItem}
                    onPress={() => setSelectedRecommendation(recommendation)}
                  >
                    <LinearGradient
                      colors={["#FFFFFF", "#F8F9FF"]}
                      style={styles.listItemGradient}
                    >
                      <View style={styles.listItemHeader}>
                        <View style={styles.listItemDateContainer}>
                          <Text style={styles.listItemDate}>
                            {new Date(recommendation.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </Text>
                          <LinearGradient
                            colors={priorityConfig.colors}
                            style={styles.listItemPriority}
                          >
                            <priorityConfig.icon size={10} color="white" />
                          </LinearGradient>
                        </View>
                        <View style={styles.listItemArrow}>
                          <ChevronRight size={16} color="#6C63FF" />
                        </View>
                      </View>

                      <Text style={styles.listItemPreview} numberOfLines={2}>
                        {allTips[0] || "Personalized insights available"}
                      </Text>

                      <View style={styles.listItemFooter}>
                        <View style={styles.listItemScore}>
                          <Star size={10} color="#FFD700" />
                          <Text style={styles.listItemScoreText}>
                            {Math.round(
                              (recommendation.confidence_score || 0) * 100
                            )}
                            %
                          </Text>
                        </View>
                        <Text style={styles.listItemCount}>
                          {allTips.length} insights
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Individual Recommendation Modal */}
      <Modal
        visible={!!selectedRecommendation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRecommendation(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.individualModalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedRecommendation(null)}
              style={styles.individualModalClose}
            >
              <LinearGradient
                colors={["#6C63FF", "#4F46E5"]}
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
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionGradient: {
    padding: 16,
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
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
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
    color: "#1a1a1a",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  // Preview Container
  previewContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  previewGradient: {
    padding: 16,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.3,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  aiBadge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  aiBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.8,
  },
  previewContent: {
    gap: 10,
    marginBottom: 12,
  },
  tipPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  moreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 26,
  },
  moreText: {
    fontSize: 11,
    color: "#6C63FF",
    fontWeight: "600",
  },
  previewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 11,
    color: "#6C63FF",
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FF",
  },
  modalHeaderGradient: {
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // List Item Styles
  recommendationListItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  listItemGradient: {
    padding: 14,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listItemDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  listItemPriority: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  listItemPreview: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4B5563",
    marginBottom: 10,
  },
  listItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  listItemScoreText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  listItemCount: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
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
    color: "#6B7280",
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
    color: "#1a1a1a",
    fontWeight: "500",
  },
});
