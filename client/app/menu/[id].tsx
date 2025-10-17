import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  ArrowLeft,
  ChefHat,
  Calendar,
  Clock,
  Star,
  Flame,
  Target,
  TrendingUp,
  Activity,
  Play,
  Eye,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Utensils,
  Award,
  Plus,
  Send,
  RefreshCw,
} from "lucide-react-native";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";

const { width: screenWidth } = Dimensions.get("window");

interface Ingredient {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  estimated_cost?: number;
}

interface Meal {
  meal_id: string;
  name: string;
  meal_type: string;
  day_number: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  prep_time_minutes?: number;
  cooking_method?: string;
  instructions?: string;
  dietary_category?: string;
  ingredients: Ingredient[];
}

interface MenuDetails {
  menu_id: string;
  title: string;
  description?: string;
  total_calories: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  total_fiber?: number;
  days_count: number;
  dietary_category?: string;
  estimated_cost?: number;
  prep_time_minutes?: number;
  difficulty_level: number;
  is_active: boolean;
  created_at: string;
  meals: Meal[];
}

export default function MenuDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  // State
  const [menu, setMenu] = useState<MenuDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Swap meal state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [mealToSwap, setMealToSwap] = useState<Meal | null>(null);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (id) {
      loadMenuDetails();
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [id]);

  const loadMenuDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/recommended-menus/${id}`);

      if (response.data.success && response.data.data) {
        setMenu(response.data.data);
      } else {
        throw new Error("Menu not found");
      }
    } catch (error: any) {
      console.error("Error loading menu details:", error);
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        language === "he"
          ? "לא ניתן לטעון את פרטי התפריט"
          : "Failed to load menu details"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMenuDetails();
    setRefreshing(false);
  }, []);

  const handleStartMenu = async () => {
    if (!menu) return;

    try {
      setIsStarting(true);
      const response = await api.post(
        `/recommended-menus/${menu.menu_id}/start-today`
      );

      if (response.data.success) {
        setShowStartModal(false);
        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "התפריט הופעל בהצלחה!"
            : "Menu started successfully!",
          [
            {
              text: language === "he" ? "אישור" : "OK",
              onPress: () =>
                router.push(`/menu/activeMenu?planId=${response.data.planId}`),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        error.message ||
          (language === "he" ? "נכשל בהפעלת התפריט" : "Failed to start menu")
      );
    } finally {
      setIsStarting(false);
    }
  };

  const getDayOfWeekNumber = (dayName: string): number => {
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      "יום ראשון": 0,
      "יום שני": 1,
      "יום שלישי": 2,
      "יום רביעי": 3,
      "יום חמישי": 4,
      "יום שישי": 5,
      "יום שבת": 6,
    };
    return dayMap[dayName.toLowerCase()] ?? 0;
  };

  const handleSwapMeal = async (
    meal: Meal,
    dayName: string,
    mealType: string
  ) => {
    try {
      setIsSwapping(true);
      setSwapError(null);
      setMealToSwap(meal);
      setShowSwapModal(true);

      console.log("🔄 Swapping meal:", {
        meal: meal.name,
        dayName,
        mealType,
        dayNumber: getDayOfWeekNumber(dayName),
      });

      // Make API call to swap meal
      const response = await api.post(
        `/recommended-menus/${menu?.menu_id}/swap-meal`,
        {
          currentMealId: meal.meal_id,
          dayOfWeek: getDayOfWeekNumber(dayName),
          mealTiming: mealType,
          preferences: {
            dietary_category: meal.dietary_category || menu?.dietary_category,
            max_prep_time: meal.prep_time_minutes || 60,
            calories_range: {
              min: Math.max(0, meal.calories - 100),
              max: meal.calories + 100,
            },
          },
        }
      );

      if (response.data.success) {
        Alert.alert(
          language === "he" ? "הצלחה!" : "Success!",
          language === "he"
            ? "הארוחה הוחלפה בהצלחה!"
            : "Meal swapped successfully!",
          [
            {
              text: language === "he" ? "אישור" : "OK",
              onPress: () => {
                setShowSwapModal(false);
                loadMenuDetails(); // Reload to get updated meal
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.error || "Failed to swap meal");
      }
    } catch (error: any) {
      console.error("💥 Swap meal error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        (language === "he" ? "נכשל בהחלפת הארוחה" : "Failed to swap meal");
      
      setSwapError(errorMessage);
      Alert.alert(
        language === "he" ? "שגיאה" : "Error",
        errorMessage
      );
    } finally {
      setIsSwapping(false);
      setTimeout(() => {
        setShowSwapModal(false);
        setMealToSwap(null);
      }, 2000);
    }
  };

  const getMealsByDay = (day: number) => {
    if (!menu) return [];
    return menu.meals.filter((meal) => meal.day_number === day);
  };

  const getDaysArray = () => {
    if (!menu) return [];
    const days = new Set(menu.meals.map((meal) => meal.day_number || 1));
    return Array.from(days).sort((a, b) => a - b);
  };

  const getDayName = (day: number): string => {
    if (language === "he") {
      const hebrewDays = [
        "יום ראשון",
        "יום שני",
        "יום שלישי",
        "יום רביעי",
        "יום חמישי",
        "יום שישי",
        "יום שבת",
      ];
      return hebrewDays[day - 1] || `יום ${day}`;
    } else {
      const englishDays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return englishDays[day - 1] || `Day ${day}`;
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return <Activity size={20} color={colors.emerald500} />;
      case "lunch":
        return <Utensils size={20} color={colors.emerald500} />;
      case "dinner":
        return <ChefHat size={20} color={colors.emerald500} />;
      case "snack":
        return <Target size={20} color={colors.emerald500} />;
      default:
        return <Utensils size={20} color={colors.emerald500} />;
    }
  };

  const formatInstructions = (instructions?: string) => {
    if (!instructions) return [];
    return instructions.split(".").filter((step) => step.trim().length > 0);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return "#10b981"; // Easy - Green
    if (level <= 3) return "#f59e0b"; // Medium - Amber
    return "#ef4444"; // Hard - Red
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return language === "he" ? "קל" : "Easy";
    if (level <= 3) return language === "he" ? "בינוני" : "Medium";
    return language === "he" ? "קשה" : "Hard";
  };

  const renderSwapModal = () => (
    <Modal
      visible={showSwapModal}
      transparent
      animationType="fade"
      onRequestClose={() => !isSwapping && setShowSwapModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === "he" ? "מחליף ארוחה..." : "Swapping Meal..."}
            </Text>
            {!isSwapping && (
              <TouchableOpacity
                onPress={() => setShowSwapModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.modalContent}>
            {isSwapping ? (
              <>
                <ActivityIndicator size="large" color={colors.emerald500} />
                <Text
                  style={[
                    styles.modalText,
                    { color: colors.text, marginTop: 16 },
                  ]}
                >
                  {language === "he"
                    ? "מחפש ארוחה חלופית מתאימה..."
                    : "Finding a suitable alternative meal..."}
                </Text>
              </>
            ) : swapError ? (
              <>
                <View
                  style={[
                    styles.errorIcon,
                    { backgroundColor: colors.error + "20" },
                  ]}
                >
                  <X size={32} color={colors.error} />
                </View>
                <Text
                  style={[
                    styles.modalText,
                    { color: colors.error, marginTop: 16 },
                  ]}
                >
                  {swapError}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStartModal = () => (
    <Modal
      visible={showStartModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStartModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {language === "he" ? "התחל תפריט" : "Start Menu"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalText, { color: colors.text }]}>
              {language === "he"
                ? "האם אתה בטוח שברצונך להתחיל תפריט זה? זה יחליף את התפריט הפעיל הנוכחי שלך."
                : "Are you sure you want to start this menu? This will replace your current active plan."}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setShowStartModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {language === "he" ? "ביטול" : "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.emerald500 },
                ]}
                onPress={handleStartMenu}
                disabled={isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Play size={16} color="#ffffff" />
                )}
                <Text style={styles.confirmButtonText}>
                  {language === "he" ? "התחל" : "Start"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMealCard = (meal: Meal) => {
    const isExpanded = expandedMeal === meal.meal_id;

    return (
      <View
        key={meal.meal_id}
        style={[styles.mealCard, { backgroundColor: colors.card }]}
      >
        <TouchableOpacity
          onPress={() => setExpandedMeal(isExpanded ? null : meal.meal_id)}
          style={styles.mealCardHeader}
        >
          <View style={styles.mealInfo}>
            <View style={styles.mealTypeContainer}>
              {getMealTypeIcon(meal.meal_type)}
              <Text style={[styles.mealName, { color: colors.text }]}>
                {meal.name}
              </Text>
            </View>
            <View style={styles.mealMeta}>
              <View
                style={[
                  styles.mealTypeBadge,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[styles.mealTypeText, { color: colors.emerald500 }]}
                >
                  {meal.meal_type}
                </Text>
              </View>
              {meal.prep_time_minutes && (
                <View style={styles.prepTimeContainer}>
                  <Clock size={12} color={colors.icon} />
                  <Text style={[styles.prepTimeText, { color: colors.icon }]}>
                    {meal.prep_time_minutes} {language === "he" ? "דק'" : "min"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.mealStats}>
            <View style={styles.caloriesBadge}>
              <Text
                style={[styles.caloriesValue, { color: colors.emerald500 }]}
              >
                {meal.calories}
              </Text>
              <Text style={[styles.caloriesLabel, { color: colors.icon }]}>
                {language === "he" ? "קלוריות" : "cal"}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={colors.icon} />
            ) : (
              <ChevronDown size={20} color={colors.icon} />
            )}
          </View>
        </TouchableOpacity>

        {/* Nutrition Preview */}
        <View style={styles.nutritionPreview}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {meal.protein}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "חלבון" : "Protein"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {meal.carbs}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "פחמימות" : "Carbs"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>
              {meal.fat}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.icon }]}>
              {language === "he" ? "שומן" : "Fat"}
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View
            style={[styles.expandedDetails, { borderTopColor: colors.border }]}
          >
            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.detailSectionTitle, { color: colors.text }]}
                >
                  {language === "he" ? "רכיבים" : "Ingredients"}
                </Text>
                <View style={styles.ingredientsGrid}>
                  {meal.ingredients.map((ingredient, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.ingredientChip,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[styles.ingredientText, { color: colors.text }]}
                      >
                        {ingredient.quantity} {ingredient.unit}{" "}
                        {ingredient.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions */}
            {meal.instructions && (
              <View style={styles.detailSection}>
                <Text
                  style={[styles.detailSectionTitle, { color: colors.text }]}
                >
                  {language === "he" ? "הוראות הכנה" : "Instructions"}
                </Text>
                <View style={styles.instructionsList}>
                  {formatInstructions(meal.instructions).map(
                    (instruction, idx) => (
                      <View key={idx} style={styles.instructionItem}>
                        <View
                          style={[
                            styles.stepNumber,
                            { backgroundColor: colors.emerald500 },
                          ]}
                        >
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        </View>
                        <Text
                          style={[
                            styles.instructionText,
                            { color: colors.text },
                          ]}
                        >
                          {instruction.trim()}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}

            {/* Cooking Method */}
            {meal.cooking_method && (
              <View
                style={[
                  styles.cookingMethodBadge,
                  { backgroundColor: colors.surface },
                ]}
              >
                <ChefHat size={16} color={colors.emerald500} />
                <Text
                  style={[
                    styles.cookingMethodText,
                    { color: colors.emerald500 },
                  ]}
                >
                  {meal.cooking_method}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.menuActions}>
              <TouchableOpacity
                style={[
                  styles.swapButton,
                  { backgroundColor: colors.surface, borderColor: colors.emerald500 },
                ]}
                onPress={() =>
                  handleSwapMeal(
                    meal,
                    getDayName(selectedDay),
                    meal.meal_type
                  )
                }
                disabled={isSwapping}
              >
                {isSwapping && mealToSwap?.meal_id === meal.meal_id ? (
                  <ActivityIndicator size="small" color={colors.emerald500} />
                ) : (
                  <RefreshCw size={16} color={colors.emerald500} />
                )}
                <Text
                  style={[styles.swapButtonText, { color: colors.emerald500 }]}
                >
                  {language === "he" ? "החלף" : "Swap"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <LoadingScreen
        text={
          language === "he" ? "טוען פרטי תפריט..." : "Loading menu details..."
        }
      />
    );
  }

  if (!menu) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <ChefHat size={48} color={colors.emerald500} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {language === "he" ? "תפריט לא נמצא" : "Menu not found"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            {language === "he"
              ? "התפריט שחיפשת אינו זמין או נמחק"
              : "The menu you're looking for is not available or has been deleted"}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.emerald500 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={18} color="#ffffff" />
            <Text style={styles.backButtonText}>
              {language === "he" ? "חזור" : "Go Back"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avgCaloriesPerDay = Math.round(
    menu.total_calories / (menu.days_count || 1)
  );
  const avgProteinPerDay = Math.round(
    (menu.total_protein || 0) / (menu.days_count || 1)
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.headerBackButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.emerald500} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === "he" ? "פרטי תפריט" : "Menu Details"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            /* Add share functionality */
          }}
        >
          <Share2 size={20} color={colors.emerald500} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollContent, { opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.emerald500]}
            tintColor={colors.emerald500}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Hero Section */}
          <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
            <View style={styles.heroHeader}>
              <View
                style={[styles.heroIcon, { backgroundColor: colors.surface }]}
              >
                <ChefHat size={32} color={colors.emerald500} />
              </View>
              <View style={styles.heroBadges}>
                <View
                  style={[styles.badge, { backgroundColor: colors.emerald500 }]}
                >
                  <Calendar size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>{menu.days_count}d</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: getDifficultyColor(
                        menu.difficulty_level
                      ),
                    },
                  ]}
                >
                  <Star size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>
                    {getDifficultyLabel(menu.difficulty_level)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {menu.title}
            </Text>

            <Text style={[styles.heroDescription, { color: colors.icon }]}>
              {menu.description ||
                (language === "he"
                  ? "תפריט מותאם אישית"
                  : "Personalized meal plan")}
            </Text>

            {/* Enhanced Nutrition Grid */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionGridItem}>
                <View
                  style={[styles.nutritionIcon, { backgroundColor: "#fef3c7" }]}
                >
                  <Activity size={16} color="#f59e0b" />
                </View>
                <Text
                  style={[styles.nutritionGridValue, { color: colors.text }]}
                >
                  {menu.prep_time_minutes || 30}m
                </Text>
                <Text
                  style={[styles.nutritionGridLabel, { color: colors.icon }]}
                >
                  {language === "he" ? "הכנה" : "Prep"}
                </Text>
              </View>
            </View>

            {/* Cost and Meta */}
            <View style={styles.heroMeta}>
              {menu.estimated_cost && (
                <View
                  style={[
                    styles.costBadge,
                    { backgroundColor: colors.emerald500 + "20" },
                  ]}
                >
                  <Text style={[styles.costText, { color: colors.emerald500 }]}>
                    ₪{menu.estimated_cost.toFixed(0)}
                  </Text>
                </View>
              )}

              <Text style={[styles.categoryText, { color: colors.icon }]}>
                {menu.dietary_category || "Balanced Menu"}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => {
                  /* Add to favorites */
                }}
              >
                <Heart size={16} color={colors.icon} />
                <Text
                  style={[styles.secondaryButtonText, { color: colors.icon }]}
                >
                  {language === "he" ? "שמור" : "Save"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.emerald500 },
                ]}
                onPress={() => setShowStartModal(true)}
              >
                <Play size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  {language === "he" ? "התחל תפריט" : "Start Menu"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Selector */}
          <View
            style={[styles.daySelectorCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.daySelectorTitle, { color: colors.text }]}>
              {language === "he" ? "בחר יום" : "Select Day"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
            >
              {getDaysArray().map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor:
                        selectedDay === day
                          ? colors.emerald500
                          : colors.surface,
                      borderColor:
                        selectedDay === day ? colors.emerald500 : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      { color: selectedDay === day ? "#ffffff" : colors.text },
                    ]}
                  >
                    {language === "he" ? `יום ${day}` : `Day ${day}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Meals List */}
          <View style={styles.mealsSection}>
            <Text style={[styles.mealsSectionTitle, { color: colors.text }]}>
              {language === "he" ? "ארוחות היום" : "Day's Meals"}
            </Text>
            {getMealsByDay(selectedDay).length > 0 ? (
              getMealsByDay(selectedDay).map(renderMealCard)
            ) : (
              <View
                style={[
                  styles.noMealsContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Utensils size={24} color={colors.icon} />
                <Text style={[styles.noMealsText, { color: colors.icon }]}>
                  {language === "he"
                    ? "אין ארוחות לתאריך זה"
                    : "No meals for this date"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Modals */}
      {renderStartModal()}
      {renderSwapModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },

  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scrollable Content
  scrollContent: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Hero Section
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBadges: {
    gap: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },

  // Nutrition Grid
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  nutritionGridItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  nutritionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  nutritionGridValue: {
    fontSize: 18,
    fontWeight: "bold",
  },

  nutritionGridLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Hero Meta
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  costBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  costText: {
    fontSize: 14,
    fontWeight: "600",
  },

  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Hero Actions
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },

  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  primaryButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Day Selector
  daySelectorCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  daySelectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  daysContainer: {
    paddingRight: 20,
    gap: 8,
  },

  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },

  dayChipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Meals Section
  mealsSection: {
    marginBottom: 24,
  },

  mealsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },

  mealCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mealInfo: {
    flex: 1,
  },

  mealTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  mealName: {
    fontSize: 16,
    fontWeight: "600",
  },

  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  mealTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  mealTypeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  prepTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  prepTimeText: {
    fontSize: 11,
    fontWeight: "500",
  },

  mealStats: {
    alignItems: "center",
    gap: 8,
  },

  caloriesBadge: {
    alignItems: "center",
  },

  caloriesValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  caloriesLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
  },

  // Nutrition Preview
  nutritionPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },

  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },

  nutritionValue: {
    fontSize: 14,
    fontWeight: "bold",
  },

  nutritionLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },

  // Expanded Details
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },

  detailSection: {
    marginBottom: 20,
  },

  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  ingredientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  ingredientText: {
    fontSize: 12,
    fontWeight: "500",
  },

  instructionsList: {
    gap: 12,
  },

  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  stepNumberText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  cookingMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },

  cookingMethodText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Menu Actions
  menuActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },

  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
  },

  swapButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // No meals state
  noMealsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 12,
  },

  noMealsText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },

  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: screenWidth - 60,
    borderRadius: 20,
    padding: 0,
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
  },

  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  confirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});