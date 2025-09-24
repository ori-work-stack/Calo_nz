
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, TrendingUp, TrendingDown, Target } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TimePeriod } from '../../src/types/statistics';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface HydrationData {
  daily: number[];
  average: number;
  target: number;
  trend: "up" | "down" | "stable";
}

interface HydrationTrackerProps {
  hydrationData: HydrationData;
  period: TimePeriod;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  hydrationData,
  period,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const achievementPercentage = Math.round((hydrationData.average / hydrationData.target) * 100);

  const getTrendIcon = () => {
    switch (hydrationData.trend) {
      case "up":
        return <TrendingUp size={16} color={colors.success} />;
      case "down":
        return <TrendingDown size={16} color={colors.error} />;
      default:
        return <Target size={16} color={colors.textSecondary} />;
    }
  };

  const renderWaterGlasses = () => {
    const totalGlasses = 8;
    const filledGlasses = Math.round((hydrationData.average / hydrationData.target) * totalGlasses);
    
    return (
      <View style={styles.glassesContainer}>
        {Array.from({ length: totalGlasses }, (_, index) => (
          <Animated.View 
            key={index}
            entering={FadeInUp.delay(index * 100)}
            style={[
              styles.waterGlass,
              {
                backgroundColor: index < filledGlasses 
                  ? colors.charts.water 
                  : `${colors.charts.water}20`
              }
            ]}
          >
            <Droplets 
              size={16} 
              color={index < filledGlasses ? "#FFF" : colors.charts.water} 
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderDailyChart = () => {
    const maxValue = Math.max(...hydrationData.daily, hydrationData.target);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {period === "week" ? "Last 7 Days" : "Daily Intake"}
        </Text>
        <View style={styles.chart}>
          {hydrationData.daily.map((value, index) => {
            const height = (value / maxValue) * 60;
            const isAboveTarget = value >= hydrationData.target;
            
            return (
              <Animated.View 
                key={index}
                entering={FadeInUp.delay(200 + index * 50)}
                style={styles.barContainer}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 4),
                      backgroundColor: isAboveTarget ? colors.success : colors.charts.water,
                    }
                  ]}
                />
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {index + 1}
                </Text>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Target line */}
        <View 
          style={[
            styles.targetLine,
            { 
              bottom: (hydrationData.target / maxValue) * 60 + 20,
              backgroundColor: colors.warning 
            }
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.surface, colors.background]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={[colors.charts.water, '#4FC3F7']}
              style={styles.iconGradient}
            >
              <Droplets size={24} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                💧 {t("statistics.hydration") || "Hydration Tracking"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t("statistics.daily_water_intake") || "Daily water intake progress"}
              </Text>
            </View>
          </View>
          
          <View style={styles.trendContainer}>
            {getTrendIcon()}
            <Text style={[styles.trendText, { color: colors.textSecondary }]}>
              {hydrationData.trend}
            </Text>
          </View>
        </View>

        {/* Achievement Section */}
        <View style={styles.achievementSection}>
          <Text style={[styles.achievementText, { color: colors.text }]}>
            {hydrationData.average.toLocaleString()}ml / {hydrationData.target.toLocaleString()}ml
          </Text>
          <Text style={[styles.percentageText, { color: colors.charts.water }]}>
            {achievementPercentage}% achieved
          </Text>
          
          <View style={styles.progressBar}>
            <Animated.View
              entering={FadeInUp.delay(300)}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(achievementPercentage, 100)}%`,
                  backgroundColor: colors.charts.water,
                }
              ]}
            />
          </View>
        </View>

        {/* Water Glasses Visualization */}
        <View style={styles.glassesSection}>
          <Text style={[styles.glassesTitle, { color: colors.text }]}>
            Daily Glasses (250ml each)
          </Text>
          {renderWaterGlasses()}
        </View>

        {/* Daily Chart */}
        {renderDailyChart()}

        {/* Tips */}
        <View style={[styles.tipsSection, { backgroundColor: `${colors.charts.water}10` }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>
            💡 Hydration Tips
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Start your day with a glass of water
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Keep a water bottle nearby while working
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Set hourly reminders to drink water
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  achievementSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  achievementText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  glassesSection: {
    marginBottom: 24,
  },
  glassesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  glassesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  waterGlass: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  tipsSection: {
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
});
