import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Droplets } from "lucide-react-native";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 400;

interface NutritionData {
  calories: number;
  targetCalories: number;
  burnedCalories?: number;
  protein: number;
  targetProtein: number;
  carbs: number;
  targetCarbs: number;
  fat: number;
  targetFat: number;
  fiber?: number;
  targetFiber?: number;
  sugar?: number;
  targetSugar?: number;
  sodium?: number;
  targetSodium?: number;
  cholesterol?: number;
  targetCholesterol?: number;
  saturatedFat?: number;
  targetSaturatedFat?: number;
  vitaminA?: number;
  targetVitaminA?: number;
  vitaminC?: number;
  targetVitaminC?: number;
  calcium?: number;
  targetCalcium?: number;
  iron?: number;
  targetIron?: number;
}

interface CircularCaloriesProgressProps {
  nutrition?: NutritionData;
  calories?: number;
  targetCalories?: number;
  burnedCalories?: number;
  dailyGoals?: {
    protein: number;
    carbs: number;
    fat: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  };
  waterIntake?: {
    current: number;
    target: number;
    onIncrement?: () => void;
    onDecrement?: () => void;
  };
}

interface NutritionCard {
  title: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  gradient: [string, string];
}

const defaultNutrition: NutritionData = {
  calories: 0,
  targetCalories: 2000,
  burnedCalories: 0,
  protein: 0,
  targetProtein: 150,
  carbs: 0,
  targetCarbs: 225,
  fat: 0,
  targetFat: 67,
};

const CircularCaloriesProgress: React.FC<CircularCaloriesProgressProps> = ({
  nutrition: nutritionProp,
  calories: caloriesProp,
  targetCalories: targetCaloriesProp,
  burnedCalories: burnedCaloriesProp,
  dailyGoals,
  waterIntake,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const nutrition: NutritionData = nutritionProp || {
    calories: caloriesProp ?? defaultNutrition.calories,
    targetCalories: targetCaloriesProp ?? defaultNutrition.targetCalories,
    burnedCalories: burnedCaloriesProp ?? defaultNutrition.burnedCalories,
    protein: dailyGoals?.protein ?? defaultNutrition.protein,
    targetProtein: dailyGoals?.targetProtein ?? defaultNutrition.targetProtein,
    carbs: dailyGoals?.carbs ?? defaultNutrition.carbs,
    targetCarbs: dailyGoals?.targetCarbs ?? defaultNutrition.targetCarbs,
    fat: dailyGoals?.fat ?? defaultNutrition.fat,
    targetFat: dailyGoals?.targetFat ?? defaultNutrition.targetFat,
  };

  const size = isSmallScreen ? 220 : 280;
  const center = size / 2;
  const radius = isSmallScreen ? 85 : 110;
  const strokeWidth = isSmallScreen ? 16 : 22;

  const remainingCalories = Math.max(
    nutrition.targetCalories - nutrition.calories,
    0
  );

  const nutritionCards: NutritionCard[] = [
    {
      title: "Calories",
      value: nutrition.calories,
      target: nutrition.targetCalories,
      unit: "kcal",
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
    },
  ];

  if (waterIntake) {
    nutritionCards.push({
      title: "Water",
      value: waterIntake.current,
      target: waterIntake.target,
      unit: "cups",
      color: "#06B6D4",
      gradient: ["#06B6D4", "#0891B2"],
    });
  }

  nutritionCards.push(
    {
      title: "Protein",
      value: nutrition.protein,
      target: nutrition.targetProtein,
      unit: "g",
      color: "#8B5CF6",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    {
      title: "Carbs",
      value: nutrition.carbs,
      target: nutrition.targetCarbs,
      unit: "g",
      color: "#3B82F6",
      gradient: ["#3B82F6", "#2563EB"],
    },
    {
      title: "Fat",
      value: nutrition.fat,
      target: nutrition.targetFat,
      unit: "g",
      color: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
    }
  );

  if (nutrition.fiber !== undefined && nutrition.targetFiber !== undefined) {
    nutritionCards.push({
      title: "Fiber",
      value: nutrition.fiber,
      target: nutrition.targetFiber,
      unit: "g",
      color: "#14B8A6",
      gradient: ["#14B8A6", "#0D9488"],
    });
  }

  if (nutrition.sugar !== undefined && nutrition.targetSugar !== undefined) {
    nutritionCards.push({
      title: "Sugar",
      value: nutrition.sugar,
      target: nutrition.targetSugar,
      unit: "g",
      color: "#EC4899",
      gradient: ["#EC4899", "#DB2777"],
    });
  }

  if (nutrition.sodium !== undefined && nutrition.targetSodium !== undefined) {
    nutritionCards.push({
      title: "Sodium",
      value: nutrition.sodium,
      target: nutrition.targetSodium,
      unit: "mg",
      color: "#EF4444",
      gradient: ["#EF4444", "#DC2626"],
    });
  }

  if (
    nutrition.saturatedFat !== undefined &&
    nutrition.targetSaturatedFat !== undefined
  ) {
    nutritionCards.push({
      title: "Saturated Fat",
      value: nutrition.saturatedFat,
      target: nutrition.targetSaturatedFat,
      unit: "g",
      color: "#F97316",
      gradient: ["#F97316", "#EA580C"],
    });
  }

  if (
    nutrition.cholesterol !== undefined &&
    nutrition.targetCholesterol !== undefined
  ) {
    nutritionCards.push({
      title: "Cholesterol",
      value: nutrition.cholesterol,
      target: nutrition.targetCholesterol,
      unit: "mg",
      color: "#6366F1",
      gradient: ["#6366F1", "#4F46E5"],
    });
  }

  if (
    nutrition.vitaminA !== undefined &&
    nutrition.targetVitaminA !== undefined
  ) {
    nutritionCards.push({
      title: "Vitamin A",
      value: nutrition.vitaminA,
      target: nutrition.targetVitaminA,
      unit: "%",
      color: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
    });
  }

  if (
    nutrition.vitaminC !== undefined &&
    nutrition.targetVitaminC !== undefined
  ) {
    nutritionCards.push({
      title: "Vitamin C",
      value: nutrition.vitaminC,
      target: nutrition.targetVitaminC,
      unit: "%",
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
    });
  }

  if (
    nutrition.calcium !== undefined &&
    nutrition.targetCalcium !== undefined
  ) {
    nutritionCards.push({
      title: "Calcium",
      value: nutrition.calcium,
      target: nutrition.targetCalcium,
      unit: "%",
      color: "#0EA5E9",
      gradient: ["#0EA5E9", "#0284C7"],
    });
  }

  if (nutrition.iron !== undefined && nutrition.targetIron !== undefined) {
    nutritionCards.push({
      title: "Iron",
      value: nutrition.iron,
      target: nutrition.targetIron,
      unit: "%",
      color: "#64748B",
      gradient: ["#64748B", "#475569"],
    });
  }

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
      >
        {nutritionCards.map((card, index) => (
          <NutritionCardView
            key={card.title}
            card={card}
            size={size}
            center={center}
            radius={radius}
            strokeWidth={strokeWidth}
            isCalories={index === 0}
            isWater={card.title === "Water"}
            burnedCalories={nutrition.burnedCalories || 0}
            remainingCalories={remainingCalories}
            onWaterIncrement={waterIntake?.onIncrement}
            onWaterDecrement={waterIntake?.onDecrement}
          />
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {nutritionCards.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => scrollToIndex(index)}
            style={[
              styles.paginationDot,
              activeIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      {nutritionCards.length > 4 && (
        <View style={styles.additionalNutrition}>
          <Text style={styles.sectionTitle}>Additional Nutrition</Text>
          <View style={styles.nutritionList}>
            {nutritionCards.slice(4).map((card) => (
              <NutritionRow key={card.title} card={card} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const NutritionCardView: React.FC<{
  card: NutritionCard;
  size: number;
  center: number;
  radius: number;
  strokeWidth: number;
  isCalories: boolean;
  isWater: boolean;
  burnedCalories: number;
  remainingCalories: number;
  onWaterIncrement?: () => void;
  onWaterDecrement?: () => void;
}> = ({
  card,
  size,
  center,
  radius,
  strokeWidth,
  isCalories,
  isWater,
  burnedCalories,
  remainingCalories,
  onWaterIncrement,
  onWaterDecrement,
}) => {
  const progress = Math.min((card.value / card.target) * 100, 100);
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (circumference * progress) / 100;
  const remaining = Math.max(card.target - card.value, 0);
  const currentMl = card.value * 250;
  const targetMl = card.target * 250;

  return (
    <View style={[styles.cardContainer, { width }]}>
      <View style={styles.circleSection}>
        {isCalories && (
          <View style={styles.caloriesWrapper}>
            <View style={styles.circleContainer}>
              <Svg width={size} height={size}>
                <Defs>
                  <LinearGradient
                    id={`gradient-${card.title}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={card.gradient[0]} />
                    <Stop offset="100%" stopColor={card.gradient[1]} />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#F3F4F6"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={`url(#gradient-${card.title})`}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${center}, ${center}`}
                />
              </Svg>
              <View style={styles.centerTextContainer}>
                <Text style={styles.centerNumber}>
                  {remainingCalories.toLocaleString()}
                </Text>
                <Text style={styles.centerLabel}>Remaining</Text>
              </View>
            </View>

            <View style={styles.statsRowBottom}>
              <View style={styles.statColumnBottom}>
                <Text style={styles.statNumberBottom}>
                  {card.value.toLocaleString()}
                </Text>
                <Text style={styles.statLabelBottom}>Eaten</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumnBottom}>
                <Text style={styles.statNumberBottom}>{burnedCalories}</Text>
                <Text style={styles.statLabelBottom}>Burned</Text>
              </View>
            </View>
          </View>
        )}

        {isWater && (
          <View style={styles.singleCircleContainer}>
            <View style={styles.waterHeader}>
              <View style={styles.waterIconContainer}>
                <Droplets size={isSmallScreen ? 26 : 30} color="#06B6D4" />
              </View>
              <View>
                <Text style={styles.cardTitle}>{card.title} Intake</Text>
                <Text style={styles.waterSubtitle}>
                  {currentMl}ml / {targetMl}ml
                </Text>
              </View>
            </View>

            <View style={styles.circleContainer}>
              <Svg width={size} height={size}>
                <Defs>
                  <LinearGradient
                    id={`gradient-${card.title}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={card.gradient[0]} />
                    <Stop offset="100%" stopColor={card.gradient[1]} />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#F3F4F6"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={`url(#gradient-${card.title})`}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${center}, ${center}`}
                />
              </Svg>
              <View style={styles.centerTextContainer}>
                <Text style={styles.centerNumber}>
                  {card.value}
                  <Text style={styles.unitText}>{card.unit}</Text>
                </Text>
                <Text style={styles.centerLabel}>
                  of {card.target} {card.unit}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!isCalories && !isWater && (
          <View style={styles.singleCircleContainer}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <View style={styles.circleContainer}>
              <Svg width={size} height={size}>
                <Defs>
                  <LinearGradient
                    id={`gradient-${card.title}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop offset="0%" stopColor={card.gradient[0]} />
                    <Stop offset="100%" stopColor={card.gradient[1]} />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="#F3F4F6"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={`url(#gradient-${card.title})`}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${center}, ${center}`}
                />
              </Svg>
              <View style={styles.centerTextContainer}>
                <Text style={styles.centerNumber}>
                  {card.value}
                  <Text style={styles.unitText}>{card.unit}</Text>
                </Text>
                <Text style={styles.centerLabel}>
                  of {card.target}
                  {card.unit}
                </Text>
                {remaining > 0 && (
                  <Text style={[styles.remainingText, { color: card.color }]}>
                    {remaining}
                    {card.unit} left
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.progressPercentage}>
              <Text style={[styles.percentageText, { color: card.color }]}>
                {progress.toFixed(0)}% Complete
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const NutritionRow: React.FC<{ card: NutritionCard }> = ({ card }) => {
  const progress = Math.min((card.value / card.target) * 100, 100);

  return (
    <View style={styles.nutritionRow}>
      <View style={styles.nutritionRowHeader}>
        <View style={[styles.nutritionDot, { backgroundColor: card.color }]} />
        <Text style={styles.nutritionRowTitle}>{card.title}</Text>
        <Text style={styles.nutritionRowValue}>
          {card.value}/{card.target}
          {card.unit}
        </Text>
      </View>
      <View style={styles.nutritionProgressBar}>
        <View
          style={[
            styles.nutritionProgressFill,
            { width: `${progress}%`, backgroundColor: card.color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardContainer: {
    paddingBottom: isSmallScreen ? 20 : 32,
    paddingTop: isSmallScreen ? 20 : 24,
  },
  circleSection: {
    marginBottom: isSmallScreen ? 20 : 32,
  },
  caloriesWrapper: {
    alignItems: "center",
  },
  statsRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: isSmallScreen ? 20 : 28,
    paddingHorizontal: isSmallScreen ? 24 : 32,
    gap: isSmallScreen ? 16 : 24,
  },
  statColumnBottom: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: isSmallScreen ? 32 : 40,
    backgroundColor: "#E5E7EB",
  },
  statNumberBottom: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabelBottom: {
    fontSize: isSmallScreen ? 12 : 13,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  centerNumber: {
    fontSize: isSmallScreen ? 32 : 44,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  unitText: {
    fontSize: isSmallScreen ? 16 : 22,
    fontWeight: "600",
    color: "#6B7280",
  },
  centerLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  remainingText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: "700",
    marginTop: 4,
  },
  singleCircleContainer: {
    alignItems: "center",
  },
  cardTitle: {
    fontSize: isSmallScreen ? 20 : 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: isSmallScreen ? 16 : 20,
  },
  progressPercentage: {
    marginTop: isSmallScreen ? 16 : 20,
  },
  percentageText: {
    fontSize: isSmallScreen ? 15 : 17,
    fontWeight: "700",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: isSmallScreen ? 16 : 20,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    transitionDuration: "all 0.3s ease",
  },
  paginationDotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  additionalNutrition: {
    paddingHorizontal: isSmallScreen ? 16 : 24,
    paddingBottom: isSmallScreen ? 20 : 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: isSmallScreen ? 12 : 16,
  },
  nutritionList: {
    gap: isSmallScreen ? 12 : 14,
  },
  nutritionRow: {
    gap: 8,
  },
  nutritionRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nutritionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nutritionRowTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  nutritionRowValue: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  nutritionProgressBar: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
  },
  nutritionProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  waterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 16 : 20,
  },
  waterIconContainer: {
    width: isSmallScreen ? 48 : 56,
    height: isSmallScreen ? 48 : 56,
    borderRadius: isSmallScreen ? 12 : 14,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  waterSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
});

export default CircularCaloriesProgress;
