import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Target, Zap, Apple } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface CircularCaloriesProgressProps {
  calories: number;
  targetCalories: number;
  dailyGoals: {
    protein: number;
    carbs: number;
    fat: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  };
  size?: number;
}

const CircularCaloriesProgress: React.FC<CircularCaloriesProgressProps> = ({
  calories,
  targetCalories,
  dailyGoals,
  size = 260,
}) => {
  const center = size / 2;
  const radius = size / 2 - 25;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress percentage
  const progress = Math.min((calories / targetCalories) * 100, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate remaining calories
  const remainingCalories = Math.max(targetCalories - calories, 0);

  // Calculate macro percentages
  const proteinProgress = Math.min(
    (dailyGoals.protein / dailyGoals.targetProtein) * 100,
    100
  );
  const carbsProgress = Math.min(
    (dailyGoals.carbs / dailyGoals.targetCarbs) * 100,
    100
  );
  const fatProgress = Math.min(
    (dailyGoals.fat / dailyGoals.targetFat) * 100,
    100
  );

  return (
    <View style={styles.container}>
      {/* Main Progress Card */}
      <View style={styles.mainCard}>
        <View style={styles.progressContainer}>
          <Svg width={size} height={size} style={styles.svg}>
            <Defs>
              <LinearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* Background Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Progress Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>

          {/* Center Content */}
          <View style={styles.centerContent}>
            <View style={styles.caloriesDisplay}>
              <Text style={styles.caloriesNumber}>
                {calories.toLocaleString()}
              </Text>
              <Text style={styles.caloriesLabel}>calories</Text>
            </View>

            <View style={styles.targetDisplay}>
              <Text style={styles.targetText}>
                of {targetCalories.toLocaleString()}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              {remainingCalories > 0 ? (
                <View style={styles.remainingBadge}>
                  <Text style={styles.remainingText}>
                    {remainingCalories} left
                  </Text>
                </View>
              ) : (
                <View style={styles.completedBadge}>
                  <Target size={14} color="#10B981" />
                  <Text style={styles.completedText}>Complete</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Macro Cards */}
      <View style={styles.macroCardsContainer}>
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View
              style={[
                styles.macroIconContainer,
                { backgroundColor: "#FEF3C7" },
              ]}
            >
              <Zap size={18} color="#F59E0B" />
            </View>
            <Text style={styles.macroTitle}>Protein</Text>
          </View>
          <Text style={styles.macroValue}>{dailyGoals.protein}g</Text>
          <Text style={styles.macroTarget}>of {dailyGoals.targetProtein}g</Text>
          <View style={styles.macroProgressContainer}>
            <View style={styles.macroProgressTrack}>
              <View
                style={[
                  styles.macroProgressBar,
                  {
                    width: `${proteinProgress}%`,
                    backgroundColor: "#F59E0B",
                  },
                ]}
              />
            </View>
            <Text style={styles.macroPercentage}>
              {Math.round(proteinProgress)}%
            </Text>
          </View>
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View
              style={[
                styles.macroIconContainer,
                { backgroundColor: "#DBEAFE" },
              ]}
            >
              <Apple size={18} color="#3B82F6" />
            </View>
            <Text style={styles.macroTitle}>Carbs</Text>
          </View>
          <Text style={styles.macroValue}>{dailyGoals.carbs}g</Text>
          <Text style={styles.macroTarget}>of {dailyGoals.targetCarbs}g</Text>
          <View style={styles.macroProgressContainer}>
            <View style={styles.macroProgressTrack}>
              <View
                style={[
                  styles.macroProgressBar,
                  {
                    width: `${carbsProgress}%`,
                    backgroundColor: "#3B82F6",
                  },
                ]}
              />
            </View>
            <Text style={styles.macroPercentage}>
              {Math.round(carbsProgress)}%
            </Text>
          </View>
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View
              style={[
                styles.macroIconContainer,
                { backgroundColor: "#FEE2E2" },
              ]}
            >
              <Target size={18} color="#EF4444" />
            </View>
            <Text style={styles.macroTitle}>Fat</Text>
          </View>
          <Text style={styles.macroValue}>{dailyGoals.fat}g</Text>
          <Text style={styles.macroTarget}>of {dailyGoals.targetFat}g</Text>
          <View style={styles.macroProgressContainer}>
            <View style={styles.macroProgressTrack}>
              <View
                style={[
                  styles.macroProgressBar,
                  {
                    width: `${fatProgress}%`,
                    backgroundColor: "#EF4444",
                  },
                ]}
              />
            </View>
            <Text style={styles.macroPercentage}>
              {Math.round(fatProgress)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
  },
  progressContainer: {
    alignItems: "center",
    paddingTop: 24,
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  caloriesDisplay: {
    alignItems: "center",
    marginBottom: 8,
  },
  caloriesNumber: {
    fontSize: 44,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -1.5,
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: -4,
  },
  targetDisplay: {
    marginBottom: 16,
  },
  targetText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  statusContainer: {
    alignItems: "center",
  },
  remainingBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  remainingText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  completedText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 4,
  },
  macroCardsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#F3F4F6",
  },
  macroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  macroIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  macroTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  macroTarget: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 12,
  },
  macroProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  macroProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
  },
  macroProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  macroPercentage: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 32,
    textAlign: "right",
  },
});

export default CircularCaloriesProgress;
