import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  fetchMeals,
  saveMealFeedback,
  toggleMealFavorite,
  duplicateMeal,
  removeMeal,
} from "@/src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
import {
  Search,
  Filter,
  Heart,
  Star,
  Copy,
  Clock,
  Flame,
  Zap,
  Droplets,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  MoreHorizontal,
  Camera,
  Wheat,
  Apple,
  Beaker,
  TreePine,
  Candy,
  Dumbbell,
  Calendar,
  Award,
  Activity,
  ShoppingCart,
  Plus,
  User,
  Bell,
  BarChart3,
  PieChart,
  List,
  Settings,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Coffee,
} from "lucide-react-native";
import LoadingScreen from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { nutritionAPI } from "@/src/services/api";

const { width, height } = Dimensions.get("window");

interface FilterOptions {
  category: string;
  dateRange: string;
  minCalories: number;
  maxCalories: number;
  showFavoritesOnly: boolean;
}

const CATEGORIES = [
  { key: "all", label: "history.categories.all", icon: Target },
  {
    key: "high_protein",
    label: "history.categories.highProtein",
    icon: Dumbbell,
  },
  { key: "high_carb", label: "history.categories.highCarb", icon: Wheat },
  { key: "high_fat", label: "history.categories.highFat", icon: Droplets },
  { key: "balanced", label: "history.categories.balanced", icon: Activity },
  { key: "low_calorie", label: "history.categories.lowCalorie", icon: Flame },
];

const DATE_RANGES = [
  { key: "all", label: "history.timeRanges.all", icon: Calendar },
  { key: "today", label: "history.timeRanges.today", icon: Clock },
  { key: "week", label: "history.timeRanges.thisWeek", icon: Calendar },
  { key: "month", label: "history.timeRanges.thisMonth", icon: Calendar },
];

const NUTRITION_ICONS = {
  calories: {
    icon: Flame,
    name: "nutrition.calories",
    color: "#f59e0b",
    unit: "kcal",
  },
  protein: {
    icon: Dumbbell,
    name: "nutrition.protein",
    color: "#8b5cf6",
    unit: "g",
  },
  carbs: { icon: Wheat, name: "nutrition.carbs", color: "#10b981", unit: "g" },
  fat: { icon: Droplets, name: "nutrition.fat", color: "#ef4444", unit: "g" },
  fiber: {
    icon: TreePine,
    name: "nutrition.fiber",
    color: "#6366f1",
    unit: "g",
  },
  sugar: { icon: Candy, name: "nutrition.sugar", color: "#f97316", unit: "g" },
  sodium: {
    icon: Beaker,
    name: "nutrition.sodium",
    color: "#64748b",
    unit: "mg",
  },
};

// Clean iOS-style meal period colors with theme support
const getMealPeriodStyle = (
  mealPeriod: string,
  colors: any,
  isDark: boolean
) => {
  const baseStyles = {
    breakfast: {
      light: {
        backgroundColor: colors.background,
        cardBackground: "#FFFBEB", // Very light warm yellow
        borderColor: "#F59E0B", // Soft golden yellow
        iconColor: "#F59E0B",
        textColor: "#D97706", // Warm amber text
      },
      dark: {
        backgroundColor: colors.surface,
        cardBackground: "#1F1611", // Deep warm brown
        borderColor: "#FCD34D", // Bright golden yellow
        iconColor: "#FCD34D",
        textColor: "#FEF3C7", // Light cream text
      },
      icon: Sunrise,
    },
    lunch: {
      light: {
        backgroundColor: colors.background,
        cardBackground: "#FDF2F8", // Very light pink-rose
        borderColor: "#EC4899", // Soft pink
        iconColor: "#EC4899",
        textColor: "#BE185D", // Deep rose
      },
      dark: {
        backgroundColor: colors.surface,
        cardBackground: "#1F0A14", // Deep rose-brown
        borderColor: "#F472B6", // Bright pink
        iconColor: "#F472B6",
        textColor: "#FECACA", // Light pink text
      },
      icon: Sun,
    },
    dinner: {
      light: {
        backgroundColor: colors.background,
        cardBackground: "#F0FDF4", // Very light sage green
        borderColor: "#10B981", // Soft emerald
        iconColor: "#10B981",
        textColor: "#047857", // Deep green
      },
      dark: {
        backgroundColor: colors.surface,
        cardBackground: "#022C22", // Deep forest green
        borderColor: "#34D399", // Bright emerald
        iconColor: "#34D399",
        textColor: "#A7F3D0", // Light mint text
      },
      icon: Sunset,
    },
    snack: {
      light: {
        backgroundColor: colors.background,
        cardBackground: "#FEF3E2", // Very light peach
        borderColor: "#F97316", // Soft orange
        iconColor: "#F97316",
        textColor: "#EA580C", // Deep orange
      },
      dark: {
        backgroundColor: colors.surface,
        cardBackground: "#1C1006", // Deep orange-brown
        borderColor: "#FB923C", // Bright orange
        iconColor: "#FB923C",
        textColor: "#FED7AA", // Light peach text
      },
      icon: Apple,
    },
    late_night: {
      light: {
        backgroundColor: colors.background,
        cardBackground: "#F0F9FF", // Very light blue
        borderColor: "#0284C7", // Deep sky blue
        iconColor: "#0284C7",
        textColor: "#0369A1", // Darker blue
      },
      dark: {
        backgroundColor: colors.surface,
        cardBackground: "#0A1628", // Deep navy blue
        borderColor: "#38BDF8", // Bright sky blue
        iconColor: "#38BDF8",
        textColor: "#BAE6FD", // Light blue text
      },
      icon: Moon,
    },
  };

  const mealType = mealPeriod?.toLowerCase().replace(/\s+/g, "_") || "other";
  const style = baseStyles[mealType as keyof typeof baseStyles];

  if (!style) {
    return {
      backgroundColor: colors.surface,
      cardBackground: colors.background, // Default pastel background
      borderColor: colors.border,
      iconColor: colors.icon,
      textColor: colors.text,
      icon: Coffee,
    };
  }

  return {
    ...style[isDark ? "dark" : "light"],
    icon: style.icon,
  };
};

// Enhanced Swipeable Meal Card Component
const SwipeableMealCard = ({
  meal,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  colors,
  isDark,
}: any) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingRatings, setSavingRatings] = useState(false);
  const [localMealData, setLocalMealData] = useState({
    taste_rating: meal.taste_rating || 0,
    satiety_rating: meal.satiety_rating || 0,
    energy_rating: meal.energy_rating || 0,
    heaviness_rating: meal.heaviness_rating || 0,
    is_favorite: meal.is_favorite || false,
  });
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === "he";
  const { refreshMealData, immediateRefresh } = useMealDataRefresh();

  const animatedHeight = useState(new Animated.Value(0))[0];
  const mealPeriodStyle = getMealPeriodStyle(
    meal.meal_period || meal.mealPeriod || "other",
    colors,
    isDark
  );
  const MealIcon = mealPeriodStyle.icon;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    setLocalMealData({
      taste_rating: meal.taste_rating || 0,
      satiety_rating: meal.satiety_rating || 0,
      energy_rating: meal.energy_rating || 0,
      heaviness_rating: meal.heaviness_rating || 0,
      is_favorite: meal.is_favorite || false,
    });
  }, [
    meal.taste_rating,
    meal.satiety_rating,
    meal.energy_rating,
    meal.heaviness_rating,
    meal.is_favorite,
  ]);

  const handleRatingChange = (key: string, value: number) => {
    setLocalMealData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleFavorite = async () => {
    try {
      setLocalMealData((prev) => ({ ...prev, is_favorite: !prev.is_favorite }));
      await onToggleFavorite(meal.id || meal.meal_id?.toString());
    } catch (error) {
      setLocalMealData((prev) => ({ ...prev, is_favorite: !prev.is_favorite }));
    }
  };

  const handleSaveRatings = async () => {
    try {
      setSavingRatings(true);
      const mealId = meal.id || meal.meal_id?.toString();
      if (!mealId) throw new Error("No meal ID found");

      const result = await dispatch(
        saveMealFeedback({
          mealId,
          feedback: {
            tasteRating: localMealData.taste_rating,
            satietyRating: localMealData.satiety_rating,
            energyRating: localMealData.energy_rating,
            heavinessRating: localMealData.heaviness_rating,
          },
        })
      ).unwrap();

      if (result) {
        Alert.alert(t("common.success"), t("history.messages.ratingsSaved"));
        immediateRefresh();
      }
    } catch (error) {
      console.error("Failed to save ratings:", error);
      Alert.alert(t("common.error"), t("history.messages.ratingsSaveFailed"));
    } finally {
      setSavingRatings(false);
    }
  };

  const renderLeftActions = () => (
    <View style={[styles.swipeActionContainer]}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#10b981" }]}
        onPress={() => onDuplicate(meal.id || meal.meal_id?.toString())}
      >
        <Copy size={22} color="#ffffff" />
        <Text style={[styles.swipeActionText, { color: "#ffffff" }]}>
          {t("history.actions.copy")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.swipeActionContainer]}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#ef4444" }]}
        onPress={() => onDelete(meal.id || meal.meal_id?.toString())}
      >
        <Trash2 size={22} color="#ffffff" />
        <Text style={[styles.swipeActionText, { color: "#ffffff" }]}>
          {t("history.actions.delete")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Star
              size={20}
              color={star <= rating ? "#fbbf24" : "#d1d5db"}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getNutritionValue = (key: string) => {
    switch (key) {
      case "calories":
        return Math.round(meal.calories || 0);
      case "protein":
        return Math.round(meal.protein_g || meal.protein || 0);
      case "carbs":
        return Math.round(meal.carbs_g || meal.carbs || 0);
      case "fat":
        return Math.round(meal.fats_g || meal.fat || 0);
      case "fiber":
        return Math.round(meal.fiber_g || meal.fiber || 0);
      case "sugar":
        return Math.round(meal.sugar_g || meal.sugar || 0);
      case "sodium":
        return Math.round(meal.sodium_mg || meal.sodium || 0);
      default:
        return 0;
    }
  };

  const getIngredients = () => {
    if (!meal.ingredients) return [];
    if (Array.isArray(meal.ingredients)) return meal.ingredients;
    if (typeof meal.ingredients === "string") {
      try {
        return JSON.parse(meal.ingredients);
      } catch {
        return [];
      }
    }
    return [];
  };

  const ingredients = getIngredients();

  const handleAddSingleIngredientToShopping = (ingredient: string) => {
    Alert.alert(
      t("shoppingList.addSingle.title"),
      t("shoppingList.addSingle.message", { 0: ingredient }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.add"),
          onPress: async () => {
            try {
              const response = await nutritionAPI.addShoppingItem(ingredient);
              if (response.status === 200) {
                Alert.alert(
                  t("common.success"),
                  t("shoppingList.addSingle.success", { 0: ingredient })
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  t("shoppingList.addSingle.error")
                );
              }
            } catch (error) {
              console.error(
                "Failed to add ingredient to shopping list:",
                error
              );
              Alert.alert(
                t("common.error"),
                t("history.messages.generalError")
              );
            }
          },
        },
      ]
    );
  };

  const handleAddIngredientsToShopping = (ingredientsList: any[]) => {
    Alert.alert(
      t("shoppingList.addAll.title"),
      t("shoppingList.addAll.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("shoppingList.addAll.action"),
          onPress: async () => {
            try {
              const itemsToAdd = ingredientsList.map((ing) =>
                typeof ing === "string" ? ing : ing.name || ing.ingredient_name
              );
              const response = await fetch("/api/shopping_lists/add_items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: itemsToAdd }),
              });
              if (response.ok) {
                Alert.alert(
                  t("common.success"),
                  t("shoppingList.addAll.success")
                );
              } else {
                Alert.alert(t("common.error"), t("shoppingList.addAll.error"));
              }
            } catch (error) {
              console.error(
                "Failed to add ingredients to shopping list:",
                error
              );
              Alert.alert(
                t("common.error"),
                t("history.messages.generalError")
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.swipeContainer}>
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        rightThreshold={60}
        leftThreshold={60}
      >
        <View
          style={[
            styles.modernMealCard,
            {
              backgroundColor: mealPeriodStyle.borderColor,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.95}
          >
            <View style={styles.cardImageContainer}>
              {meal.image_url ? (
                <Image
                  source={{ uri: meal.image_url }}
                  style={styles.cardImage}
                />
              ) : (
                <View
                  style={[
                    styles.imagePlaceholder,
                    { backgroundColor: mealPeriodStyle.backgroundColor },
                  ]}
                >
                  <Camera size={28} color={mealPeriodStyle.iconColor} />
                </View>
              )}

              {localMealData.is_favorite && (
                <View
                  style={[styles.heartOverlay, { backgroundColor: "#ef4444" }]}
                >
                  <Heart size={16} color="#ffffff" fill="#ef4444" />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.mealHeader}>
                <Text
                  style={[
                    styles.mealName,
                    { color: mealPeriodStyle.textColor },
                  ]}
                  numberOfLines={1}
                >
                  {meal.meal_name || meal.name || t("common.unknown_meal")}
                </Text>
                <View
                  style={[
                    styles.mealTypeBadge,
                    {
                      backgroundColor: mealPeriodStyle.borderColor,
                    },
                  ]}
                >
                  <MealIcon size={14} color="#ffffff" />
                  <Text style={styles.mealTypeText}>
                    {(meal.meal_period || meal.mealPeriod || "other")
                      .charAt(0)
                      .toUpperCase() +
                      (meal.meal_period || meal.mealPeriod || "other").slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.mealMetaRow}>
                <View
                  style={[
                    styles.caloriesBadge,
                    { backgroundColor: mealPeriodStyle.backgroundColor },
                  ]}
                >
                  <Flame size={14} color={mealPeriodStyle.iconColor} />
                  <Text
                    style={[
                      styles.caloriesText,
                      { color: mealPeriodStyle.textColor },
                    ]}
                  >
                    {Math.round(meal.calories || 0)} {t("nutrition.calories")}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.mealDate,
                    { color: mealPeriodStyle.textColor },
                  ]}
                >
                  {new Date(
                    meal.created_at || meal.upload_time
                  ).toLocaleDateString()}
                </Text>
              </View>

              {localMealData.taste_rating > 0 && (
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      color={
                        i < localMealData.taste_rating ? "#fbbf24" : "#d1d5db"
                      }
                      fill={
                        i < localMealData.taste_rating
                          ? "#fbbf24"
                          : "transparent"
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteButton}
              activeOpacity={0.7}
            >
              <Heart
                size={20}
                color={localMealData.is_favorite ? "#ef4444" : "#9ca3af"}
                fill={localMealData.is_favorite ? "#ef4444" : "transparent"}
              />
            </TouchableOpacity>

            <View style={styles.expandButton}>
              {isExpanded ? (
                <ChevronUp size={18} color={mealPeriodStyle.iconColor} />
              ) : (
                <ChevronDown size={18} color={mealPeriodStyle.iconColor} />
              )}
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.expandedSection,
              {
                opacity: animatedHeight,
                maxHeight: animatedHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1000],
                }),
              },
            ]}
          >
            {isExpanded && (
              <View
                style={[
                  styles.expandedContent,
                  { backgroundColor: mealPeriodStyle.borderColor },
                ]}
              >
                <View style={styles.nutritionSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: mealPeriodStyle.textColor },
                    ]}
                  >
                    {t("history.nutritionInfo")}
                  </Text>
                  <View style={styles.nutritionGrid}>
                    {Object.entries(NUTRITION_ICONS).map(([key, config]) => {
                      const IconComponent = config.icon;
                      const value = getNutritionValue(key);
                      return (
                        <View
                          key={key}
                          style={[
                            styles.nutritionCard,
                            {
                              backgroundColor:
                                mealPeriodStyle.cardBackground ||
                                mealPeriodStyle.backgroundColor,
                            },
                          ]}
                        >
                          <View style={styles.nutritionCardHeader}>
                            <View
                              style={[
                                styles.nutritionIconContainer,
                                { backgroundColor: config.color + "20" },
                              ]}
                            >
                              <IconComponent size={16} color={config.color} />
                            </View>
                            <Text
                              style={[
                                styles.nutritionCardName,
                                { color: mealPeriodStyle.textColor },
                              ]}
                            >
                              {t(config.name)}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.nutritionCardValue,
                              { color: mealPeriodStyle.textColor },
                            ]}
                          >
                            {value} {config.unit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {ingredients && ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <View style={styles.ingredientsSectionHeader}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: mealPeriodStyle.textColor },
                        ]}
                      >
                        {t("history.ingredients")} ({ingredients.length})
                      </Text>
                      {ingredients.length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.addToShoppingButton,
                            {
                              backgroundColor:
                                mealPeriodStyle.borderColor + "20",
                            },
                          ]}
                          onPress={() =>
                            handleAddIngredientsToShopping(ingredients)
                          }
                        >
                          <ShoppingCart
                            size={16}
                            color={mealPeriodStyle.borderColor}
                          />
                          <Text
                            style={[
                              styles.addToShoppingText,
                              { color: mealPeriodStyle.borderColor },
                            ]}
                          >
                            {t("history.addToShopping")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.ingredientsScrollContainer}
                    >
                      {ingredients.map((ingredient: any, index: number) => {
                        const ingredientName =
                          typeof ingredient === "string"
                            ? ingredient
                            : ingredient.name ||
                              ingredient.ingredient_name ||
                              `Ingredient ${index + 1}`;

                        return (
                          <TouchableOpacity
                            key={`ingredient-${index}`}
                            style={[
                              styles.ingredientChip,
                              {
                                backgroundColor: mealPeriodStyle.cardBackground,
                              },
                            ]}
                            onPress={() =>
                              handleAddSingleIngredientToShopping(
                                ingredientName
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.ingredientText,
                                { color: mealPeriodStyle.textColor },
                              ]}
                            >
                              {ingredientName}
                            </Text>
                            <Plus
                              size={12}
                              color={mealPeriodStyle.iconColor}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.ratingSection}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: mealPeriodStyle.textColor },
                    ]}
                  >
                    {t("history.rateExperience")}
                  </Text>

                  <View style={styles.ratingsContainer}>
                    {[
                      {
                        key: "taste_rating",
                        label: "history.ratings.taste",
                        icon: "😋",
                      },
                      {
                        key: "satiety_rating",
                        label: "history.ratings.fullness",
                        icon: "🤤",
                      },
                      {
                        key: "energy_rating",
                        label: "history.ratings.energy",
                        icon: "⚡",
                      },
                      {
                        key: "heaviness_rating",
                        label: "history.ratings.heaviness",
                        icon: "🥱",
                      },
                    ].map(({ key, label, icon }) => (
                      <View
                        key={key}
                        style={[
                          styles.ratingItem,
                          { backgroundColor: mealPeriodStyle.backgroundColor },
                        ]}
                      >
                        <View style={styles.ratingItemHeader}>
                          <Text style={styles.ratingEmoji}>{icon}</Text>
                          <Text
                            style={[
                              styles.ratingLabel,
                              { color: mealPeriodStyle.textColor },
                            ]}
                          >
                            {t(label)}
                          </Text>
                        </View>
                        {renderStarRating(
                          localMealData[
                            key as keyof typeof localMealData
                          ] as number,
                          (rating) => handleRatingChange(key, rating)
                        )}
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: mealPeriodStyle.borderColor },
                    ]}
                    onPress={handleSaveRatings}
                    disabled={savingRatings}
                    activeOpacity={0.8}
                  >
                    {savingRatings ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Award size={18} color="#ffffff" />
                        <Text
                          style={[styles.saveButtonText, { color: "#ffffff" }]}
                        >
                          {t("history.saveRatings")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Swipeable>
    </View>
  );
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark, theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { refreshAllMealData, refreshMealData } = useMealDataRefresh();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    dateRange: "all",
    minCalories: 0,
    maxCalories: 2000,
    showFavoritesOnly: false,
  });

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllMealData();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllMealData]);

  const handleToggleFavorite = useCallback(
    async (mealId: string) => {
      try {
        const result = await dispatch(toggleMealFavorite(mealId)).unwrap();
        if (result) {
          Alert.alert(
            t("common.success"),
            result.isFavorite
              ? t("history.messages.addedToFavorites")
              : t("history.messages.removedFromFavorites")
          );
          refreshMealData();
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        Alert.alert(
          t("common.error"),
          t("history.messages.favoriteUpdateFailed")
        );
      }
    },
    [dispatch, refreshMealData, t]
  );

  const handleDuplicateMeal = useCallback(
    async (mealId: string) => {
      try {
        await dispatch(
          duplicateMeal({
            mealId,
            newDate: new Date().toISOString().split("T")[0],
          })
        ).unwrap();
        Alert.alert(t("common.success"), t("history.messages.mealDuplicated"));
        refreshMealData();
      } catch (error) {
        console.error("Failed to duplicate meal:", error);
        Alert.alert(t("common.error"), t("history.messages.duplicateFailed"));
      }
    },
    [dispatch, refreshMealData, t]
  );

  const handleRemoveMeal = useCallback(
    async (mealId: string) => {
      Alert.alert(
        t("history.messages.deleteMeal"),
        t("history.messages.deleteConfirmation"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(removeMeal(mealId)).unwrap();
                Alert.alert(
                  t("common.success"),
                  t("history.messages.mealDeleted")
                );
                refreshMealData();
              } catch (error) {
                console.error("Failed to remove meal:", error);
                Alert.alert(
                  t("common.error"),
                  t("history.messages.deleteFailed")
                );
              }
            },
          },
        ]
      );
    },
    [dispatch, refreshMealData, t]
  );

  const filteredMeals = useMemo(() => {
    if (!meals) return [];

    return meals.filter((meal: any) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          meal.name?.toLowerCase().includes(query) ||
          meal.meal_name?.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filters.category !== "all") {
        const calories = meal.calories || 0;
        const protein = meal.protein || meal.protein_g || 0;
        const carbs = meal.carbs || meal.carbs_g || 0;
        const fat = meal.fat || meal.fats_g || 0;
        const total = protein + carbs + fat;

        switch (filters.category) {
          case "high_protein":
            if (total === 0 || protein / total < 0.3) return false;
            break;
          case "high_carb":
            if (total === 0 || carbs / total < 0.5) return false;
            break;
          case "high_fat":
            if (total === 0 || fat / total < 0.35) return false;
            break;
          case "balanced":
            if (total === 0) return false;
            const proteinRatio = protein / total;
            const carbRatio = carbs / total;
            const fatRatio = fat / total;
            if (
              proteinRatio < 0.2 ||
              proteinRatio > 0.4 ||
              carbRatio < 0.3 ||
              carbRatio > 0.6 ||
              fatRatio < 0.15 ||
              fatRatio > 0.4
            )
              return false;
            break;
          case "low_calorie":
            if (calories > 300) return false;
            break;
        }
      }

      const calories = meal.calories || 0;
      if (calories < filters.minCalories || calories > filters.maxCalories) {
        return false;
      }

      if (filters.showFavoritesOnly && !meal.is_favorite) {
        return false;
      }

      if (filters.dateRange !== "all") {
        const mealDate = new Date(meal.created_at || meal.upload_time);
        const now = new Date();

        switch (filters.dateRange) {
          case "today":
            if (mealDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (mealDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (mealDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [meals, searchQuery, filters]);

  const insights = useMemo(() => {
    if (!filteredMeals.length) return null;

    const totalCalories = filteredMeals.reduce(
      (sum: number, meal: any) => sum + (meal.calories || 0),
      0
    );
    const avgCalories = Math.round(totalCalories / filteredMeals.length);
    const favoriteMeals = filteredMeals.filter((meal: any) => meal.is_favorite);
    const ratedMeals = filteredMeals.filter(
      (meal: any) => meal.taste_rating && meal.taste_rating > 0
    );
    const avgRating =
      ratedMeals.length > 0
        ? ratedMeals.reduce(
            (sum: number, meal: any) => sum + (meal.taste_rating || 0),
            0
          ) / ratedMeals.length
        : 0;

    return {
      totalMeals: filteredMeals.length,
      avgCalories,
      favoriteMeals: favoriteMeals.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalCalories,
    };
  }, [filteredMeals]);

  const listData = useMemo(() => {
    const data = [];
    if (insights) {
      data.push({ type: "insights", data: insights });
    }
    return data.concat(
      filteredMeals.map((meal: any) => ({ type: "meal", data: meal }))
    );
  }, [filteredMeals, insights]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "insights") {
      return (
        <View style={styles.insightsCard}>
          <LinearGradient
            colors={[colors.primary, colors.emerald600, colors.emerald700]}
            style={styles.insightsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.insightsHeader}>
              <Text
                style={[styles.insightsTitle, { color: colors.background }]}
              >
                {t("history.insights.title")}
              </Text>
              <Text
                style={[styles.insightsSubtitle, { color: colors.background }]}
              >
                {t("history.insights.subtitle")}
              </Text>
            </View>

            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.totalMeals}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.totalMeals")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.avgCalories}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.avgCalories")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.favoriteMeals}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.favorites")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text
                  style={[styles.insightValue, { color: colors.background }]}
                >
                  {item.data.avgRating}
                </Text>
                <Text
                  style={[styles.insightLabel, { color: colors.background }]}
                >
                  {t("history.insights.avgRating")}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <SwipeableMealCard
        key={item.data.meal_id}
        meal={item.data}
        onDelete={handleRemoveMeal}
        onDuplicate={handleDuplicateMeal}
        onToggleFavorite={handleToggleFavorite}
        colors={colors}
        isDark={isDark}
      />
    );
  };

  if (isLoading && !meals.length) {
    return <LoadingScreen text={t("history.loading")} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Clean Header */}
        <LinearGradient
          colors={[colors.primary, colors.emerald600, colors.emerald700]}
          style={styles.modernHeader}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: "#ffffff" }]}>
                {t("history.title")}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
                onPress={() =>
                  setViewMode(viewMode === "list" ? "grid" : "list")
                }
              >
                {viewMode === "list" ? (
                  <BarChart3 size={20} color="#ffffff" />
                ) : (
                  <List size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Search size={20} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={[styles.searchInput, { color: "#ffffff" }]}
                placeholder={t("history.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => {
              const isSelected = filters.category === category.key;
              const IconComponent = category.icon;
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: category.key,
                    }))
                  }
                >
                  <IconComponent size={14} color="#ffffff" />
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: "#ffffff",
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {t(category.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        {listData.length > 0 ? (
          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              item.type === "insights" ? "insights" : index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.mealsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.emerald]}
                tintColor={colors.emerald}
                progressBackgroundColor={colors.surface}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyStateIcon,
                { backgroundColor: colors.emerald + "15" },
              ]}
            >
              <Clock size={48} color={colors.emerald} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("history.emptyState.title")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ||
              filters.category !== "all" ||
              filters.showFavoritesOnly
                ? t("history.emptyState.adjustedFilters")
                : t("history.emptyState.default")}
            </Text>
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View
              style={[styles.filterModal, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t("history.filter.title")}
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("history.filter.subtitle")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={[styles.closeButton, { backgroundColor: colors.card }]}
                >
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    {t("history.filter.category")}
                  </Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      const isSelected = filters.category === category.key;
                      return (
                        <TouchableOpacity
                          key={category.key}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald + "15"
                                : colors.card,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              category: category.key,
                            }))
                          }
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald : colors.icon}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              {
                                color: isSelected
                                  ? colors.emerald
                                  : colors.text,
                              },
                            ]}
                          >
                            {t(category.label)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text
                    style={[styles.filterSectionTitle, { color: colors.text }]}
                  >
                    {t("history.filter.timePeriod")}
                  </Text>
                  <View style={styles.dateRangeGrid}>
                    {DATE_RANGES.map((range) => {
                      const IconComponent = range.icon;
                      const isSelected = filters.dateRange === range.key;
                      return (
                        <TouchableOpacity
                          key={range.key}
                          style={[
                            styles.dateRangeChip,
                            {
                              backgroundColor: isSelected
                                ? colors.emerald + "15"
                                : colors.card,
                            },
                          ]}
                          onPress={() =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: range.key,
                            }))
                          }
                        >
                          <IconComponent
                            size={16}
                            color={isSelected ? colors.emerald : colors.icon}
                          />
                          <Text
                            style={[
                              styles.dateRangeChipText,
                              {
                                color: isSelected
                                  ? colors.emerald
                                  : colors.text,
                              },
                            ]}
                          >
                            {t(range.label)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <TouchableOpacity
                    style={[
                      styles.favoritesToggle,
                      {
                        backgroundColor: filters.showFavoritesOnly
                          ? colors.emerald + "15"
                          : colors.card,
                      },
                    ]}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        showFavoritesOnly: !prev.showFavoritesOnly,
                      }))
                    }
                  >
                    <View style={styles.toggleLeft}>
                      <Heart
                        size={18}
                        color={
                          filters.showFavoritesOnly
                            ? colors.emerald
                            : colors.icon
                        }
                        fill={
                          filters.showFavoritesOnly
                            ? colors.emerald
                            : "transparent"
                        }
                      />
                      <View>
                        <Text
                          style={[
                            styles.favoritesToggleText,
                            { color: colors.text },
                          ]}
                        >
                          {t("history.filter.favoritesOnly")}
                        </Text>
                        <Text
                          style={[
                            styles.toggleSubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {t("history.filter.favoritesSubtext")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: filters.showFavoritesOnly
                            ? colors.emerald
                            : colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleSwitchThumb,
                          { backgroundColor: colors.background },
                          {
                            transform: [
                              {
                                translateX: filters.showFavoritesOnly ? 18 : 2,
                              },
                            ],
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      {
                        backgroundColor: colors.card,
                      },
                    ]}
                    onPress={() =>
                      setFilters({
                        category: "all",
                        dateRange: "all",
                        minCalories: 0,
                        maxCalories: 2000,
                        showFavoritesOnly: false,
                      })
                    }
                  >
                    <Text
                      style={[styles.resetButtonText, { color: colors.text }]}
                    >
                      {t("history.filter.reset")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      { backgroundColor: colors.emerald },
                    ]}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text
                      style={[
                        styles.applyButtonText,
                        { color: colors.background },
                      ]}
                    >
                      {t("history.filter.apply")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Clean Header
  modernHeader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    gap: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Categories
  categoriesContainer: {
    marginHorizontal: -20,
  },

  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },

  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    minHeight: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Insights Card
  insightsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  insightsGradient: {
    padding: 24,
  },

  insightsHeader: {
    marginBottom: 24,
  },

  insightsTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    color: "#ffffff",
  },

  insightsSubtitle: {
    fontSize: 14,
    opacity: 0.9,
    color: "#ffffff",
  },

  insightsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  insightItem: {
    alignItems: "center",
    flex: 1,
  },

  insightValue: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
    color: "#ffffff",
  },

  insightLabel: {
    fontSize: 11,
    opacity: 0.9,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },

  // Modern Meal Card
  swipeContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },

  modernMealCard: {
    borderRadius: 16,
    overflow: "hidden",
  },

  cardContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },

  cardImageContainer: {
    position: "relative",
    marginRight: 16,
  },

  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },

  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  heartOverlay: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  cardInfo: {
    flex: 1,
  },

  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  mealName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },

  mealTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },

  mealTypeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  mealMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  caloriesBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },

  caloriesText: {
    fontSize: 13,
    fontWeight: "700",
  },

  mealDate: {
    fontSize: 12,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },

  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  expandButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  // Swipe Actions
  swipeActionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  swipeAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    minWidth: "100%",
    borderRadius: 24,
  },

  swipeActionText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },

  // Expanded Section
  expandedSection: {
    overflow: "hidden",
  },

  expandedContent: {
    padding: 20,
    paddingTop: 0,
  },

  nutritionSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },

  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  nutritionCard: {
    flex: 1,
    minWidth: "30%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  nutritionCardHeader: {
    alignItems: "center",
    marginBottom: 10,
  },

  nutritionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  nutritionCardName: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  nutritionCardValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  // Ingredients
  ingredientsSection: {
    marginBottom: 24,
  },

  ingredientsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  ingredientsScrollContainer: {
    paddingRight: 16,
    gap: 10,
  },

  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 10,
    gap: 8,
  },

  ingredientText: {
    fontSize: 13,
    fontWeight: "700",
  },

  addToShoppingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },

  addToShoppingText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Ratings
  ratingSection: {
    marginBottom: 24,
  },

  ratingsContainer: {
    gap: 16,
    marginBottom: 20,
  },

  ratingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },

  ratingItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ratingEmoji: {
    fontSize: 20,
  },

  ratingLabel: {
    fontSize: 15,
    fontWeight: "700",
  },

  starContainer: {
    flexDirection: "row",
    gap: 4,
  },

  starButton: {
    padding: 6,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },

  // Lists
  mealsList: {
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContent: {
    padding: 20,
  },

  filterSection: {
    marginBottom: 24,
  },

  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dateRangeGrid: {
    gap: 8,
  },

  dateRangeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  dateRangeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  favoritesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  favoritesToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },

  toggleSubtext: {
    fontSize: 11,
    marginTop: 2,
  },

  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },

  toggleSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  resetButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  applyButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
