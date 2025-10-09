import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Star,
  TrendingUp,
  Award,
  RefreshCw,
  Send,
  X,
  Calendar,
  Utensils,
  Flame,
  Target,
  Heart,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { api } from "@/src/services/api";
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

interface MenuReviewStatisticsProps {
  menuId: string;
  menuName: string;
  daysCount: number;
  onClose: () => void;
  onMenuRestart?: () => void;
}

interface PerformanceMetrics {
  totalMeals: number;
  completedMeals: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  completionRate: number;
  daysCompleted: number;
}

export const MenuReviewStatistics: React.FC<MenuReviewStatisticsProps> = ({
  menuId,
  menuName,
  daysCount,
  onClose,
  onMenuRestart,
}) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const isRTL = language === "he";

  // State
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiEnhancements, setAiEnhancements] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    loadPerformanceMetrics();
  }, [menuId]);

  const loadPerformanceMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      const response = await api.get(`/recommended-menus/${menuId}/completion`);

      if (
        response.data.success &&
        response.data.completed &&
        response.data.data
      ) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "אנא דרג את התפריט" : "Please rate the menu"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/recommended-menus/${menuId}/review`, {
        rating,
        liked,
        disliked,
        suggestions,
        wouldRecommend,
      });

      Alert.alert(
        language === "he" ? "הצלחה!" : "Success!",
        language === "he" ? "הביקורת נשמרה בהצלחה" : "Review saved successfully"
      );
    } catch (error) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "שמירת הביקורת נכשלה" : "Failed to save review"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIMenu = async () => {
    if (rating === 0) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "אנא דרג את התפריט לפני יצירת תפריט חדש"
          : "Please rate the menu before generating a new one"
      );
      return;
    }

    setIsGeneratingAI(true);
    setShowAIModal(true);

    try {
      const response = await api.post(
        `/recommended-menus/${menuId}/regenerate-with-feedback`,
        {
          rating,
          liked,
          disliked,
          suggestions,
          enhancements: aiEnhancements,
          wouldRecommend,
        }
      );

      if (response.data.success) {
        setShowAIModal(false);
        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "תפריט חדש נוצר בהצלחה עם ההמלצות שלך!"
            : "New menu created successfully with your recommendations!",
          [
            {
              text: language === "he" ? "צפה בתפריט" : "View Menu",
              onPress: () => {
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he" ? "יצירת התפריט נכשלה" : "Failed to generate menu"
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderStarRating = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
        >
          <Star
            size={isTablet ? 40 : 32}
            color={star <= rating ? "#fbbf24" : colors.border}
            fill={star <= rating ? "#fbbf24" : "transparent"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPerformanceMetrics = () => {
    if (isLoadingMetrics) {
      return (
        <View
          style={[styles.metricsContainer, { backgroundColor: colors.card }]}
        >
          <ActivityIndicator size="large" color={colors.emerald500} />
        </View>
      );
    }

    if (!metrics) {
      return null;
    }

    return (
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={[styles.metricsContainer, { backgroundColor: colors.card }]}
      >
        <View style={styles.metricsHeader}>
          <BarChart3 size={24} color={colors.emerald500} />
          <Text style={[styles.metricsTitle, { color: colors.text }]}>
            {language === "he"
              ? "ביצועים והישגים"
              : "Performance & Achievements"}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: `${colors.emerald500}20` },
              ]}
            >
              <CheckCircle size={20} color={colors.emerald500} />
            </View>
            <Text style={[styles.metricValue, { color: colors.emerald500 }]}>
              {Math.round(metrics.completionRate)}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.icon }]}>
              {language === "he" ? "השלמה" : "Completion"}
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: `${colors.warning}20` },
              ]}
            >
              <Flame size={20} color={colors.warning} />
            </View>
            <Text style={[styles.metricValue, { color: colors.warning }]}>
              {Math.round(metrics.avgCalories)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.icon }]}>
              {language === "he" ? "קלוריות/יום" : "Avg Calories"}
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: `${colors.info}20` },
              ]}
            >
              <TrendingUp size={20} color={colors.info} />
            </View>
            <Text style={[styles.metricValue, { color: colors.info }]}>
              {Math.round(metrics.avgProtein)}g
            </Text>
            <Text style={[styles.metricLabel, { color: colors.icon }]}>
              {language === "he" ? "חלבון/יום" : "Avg Protein"}
            </Text>
          </View>

          <View
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: `${colors.emerald500}20` },
              ]}
            >
              <Calendar size={20} color={colors.emerald500} />
            </View>
            <Text style={[styles.metricValue, { color: colors.emerald500 }]}>
              {metrics.daysCompleted}/{daysCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.icon }]}>
              {language === "he" ? "ימים" : "Days"}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Utensils size={16} color={colors.emerald500} />
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {language === "he"
              ? `השלמת ${metrics.completedMeals} מתוך ${metrics.totalMeals} ארוחות`
              : `Completed ${metrics.completedMeals} out of ${metrics.totalMeals} meals`}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderAIModal = () => (
    <Modal
      visible={showAIModal}
      transparent
      animationType="slide"
      onRequestClose={() => !isGeneratingAI && setShowAIModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.aiModalContainer, { backgroundColor: colors.card }]}
        >
          <View style={styles.aiModalHeader}>
            <View style={styles.aiHeaderContent}>
              <Sparkles size={24} color={colors.emerald500} />
              <Text style={[styles.aiModalTitle, { color: colors.text }]}>
                {language === "he"
                  ? "יצירת תפריט משופר"
                  : "Generate Enhanced Menu"}
              </Text>
            </View>
            {!isGeneratingAI && (
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.aiModalContent}>
            <Text
              style={[styles.aiDescription, { color: colors.textSecondary }]}
            >
              {language === "he"
                ? "הבינה המלאכותית שלנו תשתמש בביקורת והמשוב שלך כדי ליצור תפריט מותאם אישית טוב יותר."
                : "Our AI will use your review and feedback to create a better personalized menu."}
            </Text>

            <View style={styles.feedbackSummary}>
              <View
                style={[
                  styles.feedbackItem,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
                <Text style={[styles.feedbackText, { color: colors.text }]}>
                  {language === "he"
                    ? `דירוג: ${rating}/5`
                    : `Rating: ${rating}/5`}
                </Text>
              </View>
              {wouldRecommend && (
                <View
                  style={[
                    styles.feedbackItem,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <ThumbsUp size={16} color={colors.emerald500} />
                  <Text style={[styles.feedbackText, { color: colors.text }]}>
                    {language === "he" ? "ממליץ" : "Recommended"}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.aiInputLabel, { color: colors.text }]}>
              {language === "he"
                ? "שיפורים נוספים (אופציונלי)"
                : "Additional Enhancements (Optional)"}
            </Text>
            <TextInput
              style={[
                styles.aiEnhancementsInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={
                language === "he"
                  ? "לדוגמה: יותר ארוחות צמחוניות, ארוחות מהירות יותר..."
                  : "e.g., More vegetarian meals, quicker prep times..."
              }
              placeholderTextColor={colors.icon}
              value={aiEnhancements}
              onChangeText={setAiEnhancements}
              multiline
              numberOfLines={4}
              editable={!isGeneratingAI}
            />

            {isGeneratingAI && (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color={colors.emerald500} />
                <Text
                  style={[styles.generatingText, { color: colors.emerald500 }]}
                >
                  {language === "he"
                    ? "יוצר תפריט מותאם אישית..."
                    : "Creating personalized menu..."}
                </Text>
              </View>
            )}
          </ScrollView>

          {!isGeneratingAI && (
            <View style={styles.aiModalActions}>
              <TouchableOpacity
                style={[
                  styles.aiCancelButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setShowAIModal(false)}
              >
                <Text style={[styles.aiCancelText, { color: colors.text }]}>
                  {language === "he" ? "ביטול" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.aiGenerateButton,
                  { backgroundColor: colors.emerald500 },
                ]}
                onPress={handleGenerateAIMenu}
              >
                <Sparkles size={16} color="#ffffff" />
                <Text style={styles.aiGenerateText}>
                  {language === "he" ? "צור תפריט" : "Generate Menu"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.emerald500, colors.emerald700]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Award size={32} color="#ffffff" />
            <Text style={styles.headerTitle}>
              {language === "he"
                ? "סיכום ודירוג תפריט"
                : "Menu Review & Summary"}
            </Text>
            <Text style={styles.headerSubtitle}>{menuName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderPerformanceMetrics()}

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.reviewSection, { backgroundColor: colors.card }]}
        >
          <View style={styles.sectionHeader}>
            <Star size={24} color={colors.emerald500} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === "he" ? "דירוג כללי" : "Overall Rating"}
            </Text>
          </View>
          {renderStarRating()}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600)}
          style={[styles.feedbackSection, { backgroundColor: colors.card }]}
        >
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <ThumbsUp size={18} color={colors.emerald500} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "מה אהבת?" : "What did you like?"}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={
                language === "he"
                  ? "תאר מה אהבת בתפריט..."
                  : "Describe what you liked about the menu..."
              }
              placeholderTextColor={colors.icon}
              value={liked}
              onChangeText={setLiked}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <ThumbsDown size={18} color={colors.icon} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he" ? "מה לא אהבת?" : "What didn't you like?"}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={
                language === "he"
                  ? "תאר מה לא אהבת..."
                  : "Describe what you didn't like..."
              }
              placeholderTextColor={colors.icon}
              value={disliked}
              onChangeText={setDisliked}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <MessageSquare size={18} color={colors.icon} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {language === "he"
                  ? "הצעות לשיפור"
                  : "Suggestions for improvement"}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              placeholder={
                language === "he"
                  ? "איך נוכל לשפר את התפריט?"
                  : "How can we improve this menu?"
              }
              placeholderTextColor={colors.icon}
              value={suggestions}
              onChangeText={setSuggestions}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.recommendButton,
              {
                backgroundColor: wouldRecommend
                  ? colors.emerald500
                  : colors.surface,
                borderColor: wouldRecommend ? colors.emerald500 : colors.border,
              },
            ]}
            onPress={() => setWouldRecommend(!wouldRecommend)}
          >
            <Heart
              size={20}
              color={wouldRecommend ? "#ffffff" : colors.icon}
              fill={wouldRecommend ? "#ffffff" : "transparent"}
            />
            <Text
              style={[
                styles.recommendText,
                { color: wouldRecommend ? "#ffffff" : colors.text },
              ]}
            >
              {language === "he"
                ? "הייתי ממליץ על התפריט לחברים"
                : "I would recommend this menu to friends"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(800)}
          style={styles.actionsSection}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.emerald500} />
            ) : (
              <>
                <Send size={20} color={colors.emerald500} />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.emerald500 },
                  ]}
                >
                  {language === "he" ? "שלח ביקורת" : "Submit Review"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {onMenuRestart && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={onMenuRestart}
            >
              <RefreshCw size={20} color={colors.info} />
              <Text style={[styles.actionButtonText, { color: colors.info }]}>
                {language === "he" ? "התחל תפריט מחדש" : "Restart Menu"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.aiButton,
              { backgroundColor: colors.emerald500 },
            ]}
            onPress={() => setShowAIModal(true)}
          >
            <Sparkles size={20} color="#ffffff" />
            <Text style={[styles.actionButtonText, { color: "#ffffff" }]}>
              {language === "he"
                ? "צור תפריט משופר עם AI"
                : "Generate AI-Enhanced Menu"}
            </Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {renderAIModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 12,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 8,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  metricsContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  metricsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  metricsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: isTablet ? 160 : 140,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: isTablet ? 14 : 12,
    textAlign: "center",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
  },
  reviewSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  starButton: {
    padding: 8,
  },
  feedbackSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: isTablet ? 16 : 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  recommendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  recommendText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  aiButton: {
    paddingVertical: 18,
  },
  actionButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  aiModalContainer: {
    width: "100%",
    maxWidth: isTablet ? 600 : 500,
    maxHeight: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  aiModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  aiHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  aiModalTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "700",
  },
  aiModalContent: {
    padding: 20,
  },
  aiDescription: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  feedbackSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  feedbackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  feedbackText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: "600",
  },
  aiInputLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  aiEnhancementsInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: isTablet ? 16 : 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  generatingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  generatingText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
  aiModalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    gap: 12,
  },
  aiCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  aiCancelText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
  },
  aiGenerateButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  aiGenerateText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
