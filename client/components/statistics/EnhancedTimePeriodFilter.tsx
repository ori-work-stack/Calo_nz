
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock, TrendingUp } from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { TimePeriod, TimeFilterOption } from "../../src/types/statistics";
import Animated, { FadeInRight } from "react-native-reanimated";

interface EnhancedTimePeriodFilterProps {
  filters: TimeFilterOption[];
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  statisticsData?: any;
}

export const EnhancedTimePeriodFilter: React.FC<EnhancedTimePeriodFilterProps> = ({
  filters,
  selectedPeriod,
  onPeriodChange,
  statisticsData,
}) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  const getPeriodIcon = (period: TimePeriod) => {
    switch (period) {
      case "today":
        return <Clock size={16} color={colors.primary} />;
      case "week":
        return <Calendar size={16} color={colors.primary} />;
      case "month":
        return <TrendingUp size={16} color={colors.primary} />;
      default:
        return <Calendar size={16} color={colors.primary} />;
    }
  };

  const getPeriodSummary = (period: TimePeriod) => {
    if (!statisticsData) return "";
    
    switch (period) {
      case "today":
        return `${statisticsData.averageCalories || 0} kcal`;
      case "week":
        return `${statisticsData.totalDays || 7} days`;
      case "month":
        return `${statisticsData.totalDays || 30} days`;
      default:
        return "";
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {filters.map((filter, index) => (
          <Animated.View 
            key={filter.key} 
            entering={FadeInRight.delay(index * 100)}
            style={styles.filterWrapper}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedPeriod === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => onPeriodChange(filter.key)}
              activeOpacity={0.8}
            >
              {selectedPeriod === filter.key ? (
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  style={styles.activeGradient}
                >
                  <View style={styles.filterContent}>
                    {getPeriodIcon(filter.key)}
                    <Text style={[styles.activeText, { color: colors.onPrimary }]}>
                      {filter.label}
                    </Text>
                    <Text style={[styles.summaryText, { color: colors.onPrimary }]}>
                      {getPeriodSummary(filter.key)}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.filterContent}>
                  {getPeriodIcon(filter.key)}
                  <Text style={[styles.inactiveText, { color: colors.textSecondary }]}>
                    {filter.label}
                  </Text>
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {getPeriodSummary(filter.key)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  filterContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterWrapper: {
    flex: 1,
  },
  filterButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  activeFilterButton: {
    // Additional styling if needed
  },
  activeGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  filterContent: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  activeText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  inactiveText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  summaryText: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
});
