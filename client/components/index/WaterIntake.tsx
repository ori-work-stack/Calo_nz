import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Droplets, Plus, Minus } from "lucide-react-native";

interface WaterIntakeCardProps {
  currentCups: number;
  maxCups?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

const WaterIntakeCard: React.FC<WaterIntakeCardProps> = ({
  currentCups,
  maxCups = 10,
  onIncrement,
  onDecrement,
  disabled = false,
}) => {
  const progress = Math.min((currentCups / maxCups) * 100, 100);
  const currentMl = currentCups * 250;
  const targetMl = maxCups * 250;
  const isComplete = currentCups >= maxCups;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Droplets size={28} color="#06b6d4" />
            </View>
            <View>
              <Text style={styles.title}>Water Intake</Text>
              <Text style={styles.subtitle}>
                Stay hydrated throughout the day
              </Text>
            </View>
          </View>

          {isComplete && (
            <View style={styles.badge}>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.badgeText}>Goal Reached!</Text>
            </View>
          )}
        </View>

        {/* Progress Display */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View>
              <View style={styles.cupsRow}>
                <Text style={styles.currentCups}>{currentCups}</Text>
                <Text style={styles.maxCups}> / {maxCups}</Text>
                <Text style={styles.cupsLabel}> cups</Text>
              </View>
              <Text style={styles.mlText}>
                {currentMl.toLocaleString()} ml / {targetMl.toLocaleString()} ml
              </Text>
            </View>
            <View style={styles.percentageContainer}>
              <Text style={styles.percentage}>{Math.round(progress)}%</Text>
              <Text style={styles.completeText}>complete</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Water Cups Visual */}
        <View style={styles.cupsVisual}>
          {Array.from({ length: maxCups }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.cup,
                index < currentCups ? styles.cupFilled : styles.cupEmpty,
              ]}
            >
              {index < currentCups && <Droplets size={14} color="#ffffff" />}
            </View>
          ))}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={onDecrement}
            disabled={disabled || currentCups <= 0}
            style={[
              styles.button,
              disabled || currentCups <= 0
                ? styles.buttonDisabled
                : styles.buttonActive,
            ]}
          >
            <Minus
              size={24}
              color={disabled || currentCups <= 0 ? "#d1d5db" : "#0891b2"}
            />
          </TouchableOpacity>

          <View style={styles.controlsCenter}>
            <Text style={styles.controlsCups}>{currentCups} cups</Text>
            <Text style={styles.controlsMl}>{currentMl} ml</Text>
          </View>

          <TouchableOpacity
            onPress={onIncrement}
            disabled={disabled || currentCups >= maxCups}
            style={[
              styles.button,
              disabled || currentCups >= maxCups
                ? styles.buttonDisabled
                : styles.buttonActive,
            ]}
          >
            <Plus
              size={24}
              color={disabled || currentCups >= maxCups ? "#d1d5db" : "#0891b2"}
            />
          </TouchableOpacity>
        </View>

        {/* Daily Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsContainer}>
            <View style={styles.tipIcon}>
              <Text style={styles.tipEmoji}>💡</Text>
            </View>
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Pro tip:</Text> Drink a glass of
                water first thing in the morning to kickstart your metabolism
                and hydrate after sleep.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#ecfeff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#a5f3fc",
    borderRadius: 20,
  },
  trophy: {
    fontSize: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0e7490",
  },
  progressSection: {
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cupsRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentCups: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111827",
  },
  maxCups: {
    fontSize: 20,
    fontWeight: "600",
    color: "#9ca3af",
  },
  cupsLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
  },
  mlText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 4,
  },
  percentageContainer: {
    alignItems: "flex-end",
  },
  percentage: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0891b2",
  },
  completeText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#06b6d4",
    borderRadius: 6,
  },
  cupsVisual: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  cup: {
    width: 32,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cupFilled: {
    backgroundColor: "#06b6d4",
    borderColor: "#0891b2",
  },
  cupEmpty: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  buttonActive: {
    backgroundColor: "#ecfeff",
    borderColor: "#06b6d4",
  },
  buttonDisabled: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  controlsCenter: {
    flex: 1,
    maxWidth: 200,
    alignItems: "center",
  },
  controlsCups: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  controlsMl: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 2,
  },
  tipsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ecfeff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipEmoji: {
    fontSize: 14,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: "600",
    color: "#111827",
  },
});

export default WaterIntakeCard;
