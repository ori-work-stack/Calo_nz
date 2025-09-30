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
  ListFilter as Filter,
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
  ChartBar as BarChart3,
  List,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Coffee,
} from "lucide-react-native";
import LoadingScreen from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { nutritionAPI } from "@/src/services/api";

const { width } = Dimensions.get("window");

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

const getMealPeriodStyle = (mealPeriod: string) => {
  const baseStyles = {
    breakfast: {
      backgroundColor: "#FEF3C7",
      borderColor: "#F59E0B",
      iconColor: "#F59E0B",
      textColor: "#92400E",
      icon: Sunrise,
    },
    lunch: {
      backgroundColor: "#FEE2E2",
      borderColor: "#EF4444",
      iconColor: "#EF4444",
      textColor: "#991B1B",
      icon: Sun,
    },
    dinner: {
      backgroundColor: "#DCFCE7",
      borderColor: "#10B981",
      iconColor: "#10B981",
      textColor: "#065F46",
      icon: Sunset,
    },
    snack: {
      backgroundColor: "#FED7AA",
      borderColor: "#F97316",
      iconColor: "#F97316",
      textColor: "#9A3412",
      icon: Apple,
    },
    late_night: {
      backgroundColor: "#DBEAFE",
      borderColor: "#3B82F6",
      iconColor: "#3B82F6",
      textColor: "#1E3A8A",
      icon: Moon,
    },
  };

  const mealType = mealPeriod?.toLowerCase().replace(/\s+/g, "_") || "other";
  const style = baseStyles[mealType as keyof typeof baseStyles];

  if (!style) {
    return {
      backgroundColor: "#F3F4F6",
      borderColor: "#9CA3AF",
      iconColor: "#6B7280",
      textColor: "#374151",
      icon: Coffee,
    };
  }

  return style;
};

const SwipeableMealCard = ({
  meal,
  onDelete,
  onDuplicate,
  onToggleFavorite,
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
  const { immediateRefresh } = useMealDataRefresh();

  const animatedHeight = useState(new Animated.Value(0))[0];
  const mealPeriodStyle = getMealPeriodStyle(
    meal.meal_period || meal.mealPeriod || "other"
  );
  const MealIcon = mealPeriodStyle.icon;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
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
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#10b981" }]}
        onPress={() => onDuplicate(meal.id || meal.meal_id?.toString())}
      >
        <Copy size={22} color="#ffffff" />
        <Text style={styles.swipeActionText}>{t("history.actions.copy")}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#ef4444" }]}
        onPress={() => onDelete(meal.id || meal.meal_id?.toString())}
      >
        <Trash2 size={22} color="#ffffff" />
        <Text style={styles.swipeActionText}>
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

  return (
    <View style={styles.swipeContainer}>
      <Swipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        rightThreshold={60}
        leftThreshold={60}
      >
        <View style={[styles.mealCard, { backgroundColor: "#FFFFFF" }]}>
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
                <View style={styles.heartOverlay}>
                  <Heart size={14} color="#ef4444" fill="#ef4444" />
                </View>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {meal.meal_name || meal.name || t("common.unknown_meal")}
                </Text>
                <View
                  style={[
                    styles.mealTypeBadge,
                    {
                      backgroundColor: mealPeriodStyle.backgroundColor,
                      borderColor: mealPeriodStyle.borderColor,
                    },
                  ]}
                >
                  <MealIcon size={12} color={mealPeriodStyle.iconColor} />
                </View>
              </View>

              <View style={styles.mealMetaRow}>
                <View
                  style={[styles.caloriesBadge, { backgroundColor: "#FEF3C7" }]}
                >
                  <Flame size={14} color="#F59E0B" />
                  <Text style={[styles.caloriesText, { color: "#92400E" }]}>
                    {Math.round(meal.calories || 0)} kcal
                  </Text>
                </View>

                <Text style={styles.mealDate}>
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
                      size={12}
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
                <ChevronUp size={18} color="#10B981" />
              ) : (
                <ChevronDown size={18} color="#10B981" />
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
              <View style={styles.expandedContent}>
                <View style={styles.nutritionSection}>
                  <Text style={styles.sectionTitle}>
                    {t("history.nutritionInfo")}
                  </Text>
                  <View style={styles.nutritionGrid}>
                    {Object.entries(NUTRITION_ICONS).map(([key, config]) => {
                      const IconComponent = config.icon;
                      const value = getNutritionValue(key);
                      return (
                        <View key={key} style={styles.nutritionCard}>
                          <View style={styles.nutritionCardHeader}>
                            <View
                              style={[
                                styles.nutritionIconContainer,
                                { backgroundColor: config.color + "20" },
                              ]}
                            >
                              <IconComponent size={16} color={config.color} />
                            </View>
                          </View>
                          <Text style={styles.nutritionCardName}>
                            {t(config.name)}
                          </Text>
                          <Text style={styles.nutritionCardValue}>
                            {value} {config.unit}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {ingredients && ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <Text style={styles.sectionTitle}>
                      {t("history.ingredients")} ({ingredients.length})
                    </Text>
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
                            style={styles.ingredientChip}
                            onPress={() =>
                              handleAddSingleIngredientToShopping(
                                ingredientName
                              )
                            }
                          >
                            <Text style={styles.ingredientText}>
                              {ingredientName}
                            </Text>
                            <Plus size={12} color="#10B981" />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.ratingSection}>
                  <Text style={styles.sectionTitle}>
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
                      <View key={key} style={styles.ratingItem}>
                        <View style={styles.ratingItemHeader}>
                          <Text style={styles.ratingEmoji}>{icon}</Text>
                          <Text style={styles.ratingLabel}>{t(label)}</Text>
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
                    style={styles.saveButton}
                    onPress={handleSaveRatings}
                    disabled={savingRatings}
                    activeOpacity={0.8}
                  >
                    {savingRatings ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Award size={18} color="#ffffff" />
                        <Text style={styles.saveButtonText}>
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
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { refreshAllMealData, refreshMealData } = useMealDataRefresh();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
            colors={["#10B981", "#059669", "#047857"]}
            style={styles.insightsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.insightsHeader}>
              <Text style={styles.insightsTitle}>
                {t("history.insights.title")}
              </Text>
              <Text style={styles.insightsSubtitle}>
                {t("history.insights.subtitle")}
              </Text>
            </View>

            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{item.data.totalMeals}</Text>
                <Text style={styles.insightLabel}>
                  {t("history.insights.totalMeals")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{item.data.avgCalories}</Text>
                <Text style={styles.insightLabel}>
                  {t("history.insights.avgCalories")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>
                  {item.data.favoriteMeals}
                </Text>
                <Text style={styles.insightLabel}>
                  {t("history.insights.favorites")}
                </Text>
              </View>

              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{item.data.avgRating}</Text>
                <Text style={styles.insightLabel}>
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
      />
    );
  };

  if (isLoading && !meals.length) {
    return <LoadingScreen text={t("history.loading")} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#10B981", "#059669", "#047857"]}
          style={styles.modernHeader}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t("history.title")}</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={styles.searchInput}
                placeholder={t("history.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

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
                colors={["#10B981"]}
                tintColor="#10B981"
                progressBackgroundColor="#FFFFFF"
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Clock size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>
              {t("history.emptyState.title")}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ||
              filters.category !== "all" ||
              filters.showFavoritesOnly
                ? t("history.emptyState.adjustedFilters")
                : t("history.emptyState.default")}
            </Text>
          </View>
        )}

        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {t("history.filter.title")}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {t("history.filter.subtitle")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={styles.closeButton}
                >
                  <X size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.filterContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
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
                                ? "#D1FAE5"
                                : "#FFFFFF",
                              borderColor: isSelected ? "#10B981" : "#E5E7EB",
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
                            color={isSelected ? "#10B981" : "#6B7280"}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              {
                                color: isSelected ? "#10B981" : "#374151",
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
                  <Text style={styles.filterSectionTitle}>
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
                                ? "#D1FAE5"
                                : "#FFFFFF",
                              borderColor: isSelected ? "#10B981" : "#E5E7EB",
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
                            color={isSelected ? "#10B981" : "#6B7280"}
                          />
                          <Text
                            style={[
                              styles.dateRangeChipText,
                              {
                                color: isSelected ? "#10B981" : "#374151",
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
                          ? "#D1FAE5"
                          : "#F9FAFB",
                        borderColor: filters.showFavoritesOnly
                          ? "#10B981"
                          : "#E5E7EB",
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
                          filters.showFavoritesOnly ? "#10B981" : "#6B7280"
                        }
                        fill={
                          filters.showFavoritesOnly ? "#10B981" : "transparent"
                        }
                      />
                      <View>
                        <Text style={styles.favoritesToggleText}>
                          {t("history.filter.favoritesOnly")}
                        </Text>
                        <Text style={styles.toggleSubtext}>
                          {t("history.filter.favoritesSubtext")}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        {
                          backgroundColor: filters.showFavoritesOnly
                            ? "#10B981"
                            : "#D1D5DB",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleSwitchThumb,
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
                    style={styles.resetButton}
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
                    <Text style={styles.resetButtonText}>
                      {t("history.filter.reset")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text style={styles.applyButtonText}>
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
    backgroundColor: "#FAFAFA",
  },

  modernHeader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    color: "#FFFFFF",
  },

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
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

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
  },

  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  insightsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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

  swipeContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },

  mealCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },

  cardImageContainer: {
    position: "relative",
    marginRight: 16,
  },

  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },

  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  heartOverlay: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    color: "#111827",
  },

  mealTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    color: "#6B7280",
  },

  ratingRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },

  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: "#FFFFFF",
  },

  expandedSection: {
    overflow: "hidden",
  },

  expandedContent: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },

  nutritionSection: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },

  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  nutritionCard: {
    width: (width - 92) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  nutritionCardHeader: {
    alignItems: "center",
    marginBottom: 8,
  },

  nutritionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  nutritionCardName: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 4,
  },

  nutritionCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },

  ingredientsSection: {
    marginBottom: 20,
  },

  ingredientsScrollContainer: {
    paddingRight: 16,
    gap: 8,
  },

  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
    backgroundColor: "#DCFCE7",
  },

  ingredientText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },

  ratingSection: {
    marginBottom: 20,
  },

  ratingsContainer: {
    gap: 12,
    marginBottom: 16,
  },

  ratingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },

  ratingItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ratingEmoji: {
    fontSize: 18,
  },

  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  starContainer: {
    flexDirection: "row",
    gap: 4,
  },

  starButton: {
    padding: 4,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    backgroundColor: "#10B981",
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  mealsList: {
    paddingBottom: 24,
    paddingTop: 8,
  },

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
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#111827",
  },

  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    color: "#6B7280",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  filterModal: {
    backgroundColor: "#FFFFFF",
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
    borderBottomColor: "#F3F4F6",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: "#6B7280",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
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
    color: "#111827",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },

  categoryChipText: {
    fontSize: 13,
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
    borderWidth: 1.5,
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
    borderWidth: 1.5,
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
    color: "#374151",
  },

  toggleSubtext: {
    fontSize: 11,
    marginTop: 2,
    color: "#6B7280",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  applyButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#10B981",
  },

  applyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
