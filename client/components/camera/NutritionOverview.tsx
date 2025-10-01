import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Flame, Award } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface NutritionOverviewProps {
  nutrition: NutritionData;
  mealName: string;
}

export const NutritionOverview: React.FC<NutritionOverviewProps> = ({
  nutrition,
  mealName,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  const proteinPercent =
    totalMacros > 0 ? Math.round((nutrition.protein / totalMacros) * 100) : 0;
  const carbsPercent =
    totalMacros > 0 ? Math.round((nutrition.carbs / totalMacros) * 100) : 0;
  const fatPercent =
    totalMacros > 0 ? Math.round((nutrition.fat / totalMacros) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{mealName}</Text>
            <Text style={styles.analysisLabel}>Nutritional Analysis</Text>
          </View>
          <View style={styles.badge}>
            <Award size={16} color="#10B981" />
          </View>
        </View>

        <View style={styles.calorieSection}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.calorieCard}
          >
            <Flame size={32} color="#FFFFFF" />
            <View style={styles.calorieInfo}>
              <Text style={styles.calorieValue}>{nutrition.calories}</Text>
              <Text style={styles.calorieLabel}>calories</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.macrosGrid}>
          <View style={[styles.macroCard, styles.proteinCard]}>
            <View
              style={[styles.macroIndicator, { backgroundColor: "#3B82F6" }]}
            />
            <View style={styles.macroContent}>
              <Text style={styles.macroValue}>{nutrition.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={[styles.percentText, { color: "#3B82F6" }]}>
                {proteinPercent}%
              </Text>
            </View>
          </View>

          <View style={[styles.macroCard, styles.carbsCard]}>
            <View
              style={[styles.macroIndicator, { backgroundColor: "#F59E0B" }]}
            />
            <View style={styles.macroContent}>
              <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={[styles.percentText, { color: "#F59E0B" }]}>
                {carbsPercent}%
              </Text>
            </View>
          </View>

          <View style={[styles.macroCard, styles.fatCard]}>
            <View
              style={[styles.macroIndicator, { backgroundColor: "#EF4444" }]}
            />
            <View style={styles.macroContent}>
              <Text style={styles.macroValue}>{nutrition.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={[styles.percentText, { color: "#EF4444" }]}>
                {fatPercent}%
              </Text>
            </View>
          </View>
        </View>

        {(nutrition.fiber > 0 ||
          nutrition.sugar > 0 ||
          nutrition.sodium > 0) && (
          <View style={styles.micronutrientsSection}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            <View style={styles.microGrid}>
              {nutrition.fiber > 0 && (
                <View style={styles.microItem}>
                  <Text style={styles.microValue}>{nutrition.fiber}g</Text>
                  <Text style={styles.microLabel}>Fiber</Text>
                </View>
              )}
              {nutrition.sugar > 0 && (
                <View style={styles.microItem}>
                  <Text style={styles.microValue}>{nutrition.sugar}g</Text>
                  <Text style={styles.microLabel}>Sugar</Text>
                </View>
              )}
              {nutrition.sodium > 0 && (
                <View style={styles.microItem}>
                  <Text style={styles.microValue}>{nutrition.sodium}mg</Text>
                  <Text style={styles.microLabel}>Sodium</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A2744",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  analysisLabel: {
    fontSize: 14,
    color: "#6B7E99",
    fontWeight: "500",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  calorieSection: {
    marginBottom: 20,
  },
  calorieCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 16,
  },
  calorieInfo: {
    flex: 1,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  calorieLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginTop: 2,
  },
  macrosGrid: {
    gap: 12,
    marginBottom: 20,
  },
  macroCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    gap: 16,
  },
  proteinCard: {
    backgroundColor: "#EFF6FF",
  },
  carbsCard: {
    backgroundColor: "#FFFBEB",
  },
  fatCard: {
    backgroundColor: "#FEF2F2",
  },
  macroIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  macroContent: {
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2744",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 13,
    color: "#6B7E99",
    fontWeight: "500",
  },
  percentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  percentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  micronutrientsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2744",
    marginBottom: 14,
  },
  microGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  microItem: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: "30%",
  },
  microValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2744",
    marginBottom: 4,
  },
  microLabel: {
    fontSize: 12,
    color: "#6B7E99",
    fontWeight: "500",
  },
});
