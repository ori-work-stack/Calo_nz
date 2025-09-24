import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { NutritionMetric, TimePeriod } from "../../src/types/statistics";
import Animated, { FadeInRight, ZoomIn } from "react-native-reanimated";

interface EnhancedMetricCardProps {
  metric: NutritionMetric;
  targetLabel: string;
  trendLabel: string;
  shouldShowWarnings: boolean;
  language: string;
  periodType: TimePeriod;
  onPress?: () => void;
}

export const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  metric,
  targetLabel,
  trendLabel,
  shouldShowWarnings,
  language,
  periodType,
  onPress,
}) => {
  const { colors } = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle size={20} color={colors.success} />;
      case "good":
        return <CheckCircle size={20} color={colors.warning} />;
      case "warning":
        return <AlertTriangle size={20} color={colors.warning} />;
      case "danger":
        return <AlertTriangle size={20} color={colors.error} />;
      default:
        return <Target size={20} color={colors.textSecondary} />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} color={colors.success} />;
      case "down":
        return <TrendingDown size={16} color={colors.error} />;
      case "stable":
        return <Minus size={16} color={colors.textSecondary} />;
      default:
        return <Minus size={16} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return colors.success;
      case "good":
        return colors.warning;
      case "warning":
        return colors.warning;
      case "danger":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (value >= 1000 && unit === "ml") {
      return `${(value / 1000).toFixed(1)}L`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  const getPeriodSuffix = () => {
    switch (periodType) {
      case "week":
        return " (7-day total)";
      case "month":
        return " (30-day total)";
      default:
        return "";
    }
  };

  const progressPercentage = useMemo(() => {
    return Math.min(100, Math.max(0, metric.percentage));
  }, [metric.percentage]);

  return (
    <Animated.View entering={FadeInRight}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={[colors.surface, colors.background]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              entering={ZoomIn.delay(200)}
              style={styles.iconContainer}
            >
              {metric.icon}
            </Animated.View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {metric.name}
                {getPeriodSuffix()}
              </Text>
              <View style={styles.statusContainer}>
                {getStatusIcon(metric.status)}
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(metric.status) },
                  ]}
                >
                  {metric.status.charAt(0).toUpperCase() +
                    metric.status.slice(1)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.trendContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              {getTrendIcon(metric.trend)}
              <Text style={[styles.trendText, { color: colors.textSecondary }]}>
                {metric.lastWeekChange > 0 ? "+" : ""}
                {metric.lastWeekChange.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Values */}
          <View style={styles.valuesContainer}>
            <View style={styles.currentValue}>
              <Text style={[styles.valueText, { color: colors.text }]}>
                {formatValue(metric.value, metric.unit)}
              </Text>
              <Text
                style={[styles.targetText, { color: colors.textSecondary }]}
              >
                {targetLabel}: {formatValue(metric.target, metric.unit)}
              </Text>
            </View>
            <Animated.View
              entering={ZoomIn.delay(400)}
              style={[
                styles.percentageContainer,
                { backgroundColor: `${metric.color}15` },
              ]}
            >
              <Text style={[styles.percentageText, { color: metric.color }]}>
                {progressPercentage}%
              </Text>
            </Animated.View>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBackground,
                { backgroundColor: colors.outline },
              ]}
            >
              <Animated.View
                entering={FadeInRight.delay(600)}
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: metric.color,
                  },
                ]}
              />
              {/* Target indicator */}
              <View
                style={[
                  styles.targetIndicator,
                  {
                    left: "100%",
                    backgroundColor: colors.textSecondary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Mini Chart */}
          {metric.chartData && metric.chartData.some((v: number) => v > 0) && (
            <Animated.View
              entering={FadeInRight.delay(800)}
              style={styles.miniChart}
            >
              <Text
                style={[styles.miniChartTitle, { color: colors.textSecondary }]}
              >
                {language === "he" ? "מגמה שבועית" : "Weekly Trend"}
              </Text>
              <View style={styles.miniChartContainer}>
                {metric.chartData
                  .slice(-7)
                  .map((value: number, index: React.Key | null | undefined) => {
                    const maxValue = Math.max(...metric.chartData!.slice(-7));
                    const height = Math.max(4, (value / maxValue) * 32);
                    return (
                      <Animated.View
                        key={index}
                        entering={FadeInRight.delay(900 + Number(index) * 50)}
                        style={[
                          styles.miniChartBar,
                          {
                            height,
                            backgroundColor: metric.color,
                            opacity: 0.4 + (Number(index) / 7) * 0.6,
                          },
                        ]}
                      />
                    );
                  })}
              </View>
            </Animated.View>
          )}

          {/* Enhanced Recommendation */}
          {metric.recommendation && shouldShowWarnings && (
            <Animated.View
              entering={FadeInRight.delay(1000)}
              style={[
                styles.recommendationContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <View
                style={[
                  styles.recommendationIcon,
                  { backgroundColor: `${metric.color}20` },
                ]}
              >
                <Sparkles size={16} color={metric.color} />
              </View>
              <Text style={[styles.recommendationText, { color: colors.text }]}>
                {metric.recommendation}
              </Text>
            </Animated.View>
          )}

          {/* Period-specific insights */}
          {periodType === "week" && (
            <Animated.View
              entering={FadeInRight.delay(1100)}
              style={styles.periodInsight}
            >
              <Text
                style={[
                  styles.periodInsightText,
                  { color: colors.textSecondary },
                ]}
              >
                {language === "he"
                  ? `ממוצע יומי: ${(metric.value / 7).toFixed(1)} ${
                      metric.unit
                    }`
                  : `Daily average: ${(metric.value / 7).toFixed(1)} ${
                      metric.unit
                    }`}
              </Text>
            </Animated.View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  trendContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  currentValue: {
    flex: 1,
  },
  valueText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  targetText: {
    fontSize: 16,
    fontWeight: "500",
  },
  percentageContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  percentageText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  targetIndicator: {
    position: "absolute",
    top: 0,
    width: 2,
    height: "100%",
    marginLeft: -1,
  },
  miniChart: {
    marginBottom: 16,
  },
  miniChartTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  miniChartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 32,
    gap: 4,
  },
  miniChartBar: {
    flex: 1,
    minHeight: 4,
    borderRadius: 2,
  },
  recommendationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  periodInsight: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  periodInsightText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
