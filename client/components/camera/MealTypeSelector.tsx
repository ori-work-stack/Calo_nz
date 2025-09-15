import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import {
  Sunrise,
  Sun,
  Moon,
  Cookie,
  Clock,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";

const { width } = Dimensions.get("window");

export interface MealType {
  id: string;
  label: string;
  period: string;
  icon: React.ReactNode;
  colors: string[];
  lightColor: string;
  darkColor: string;
}

interface MealTypeSelectorProps {
  onSelect: (mealType: MealType) => void;
  selectedType?: MealType;
}

// Function to create meal types with theme colors
const getMealTypesWithTheme = (
  colors: any,
  emeraldSpectrum: any
): MealType[] => [
  {
    id: "breakfast",
    label: "Breakfast",
    period: "breakfast",
    icon: <Sunrise size={24} color="#ffffff" />,
    colors: [colors.warning, "#F59E0B", "#D97706"], // Keep warm orange for breakfast
    lightColor: "#FEF3C7",
    darkColor: "#D97706",
  },
  {
    id: "lunch",
    label: "Lunch",
    period: "lunch",
    icon: <Sun size={24} color="#ffffff" />,
    colors: [colors.info, "#3B82F6", "#1D4ED8"], // Keep blue for lunch
    lightColor: "#DBEAFE",
    darkColor: "#1D4ED8",
  },
  {
    id: "dinner",
    label: "Dinner",
    period: "dinner",
    icon: <Moon size={24} color="#ffffff" />,
    colors: ["#E0E7FF", "#6366F1", "#4338CA"], // Keep purple for dinner
    lightColor: "#E0E7FF",
    darkColor: "#4338CA",
  },
  {
    id: "snack",
    label: "Snack",
    period: "snack",
    icon: <Cookie size={24} color="#ffffff" />,
    colors: [
      emeraldSpectrum.emerald100,
      emeraldSpectrum.emerald500,
      emeraldSpectrum.emerald700,
    ], // Use theme emerald
    lightColor: emeraldSpectrum.emerald50,
    darkColor: emeraldSpectrum.emerald700,
  },
  {
    id: "late_night",
    label: "Late Night",
    period: "late_night",
    icon: <Clock size={24} color="#ffffff" />,
    colors: [
      colors.primary,
      emeraldSpectrum.emerald600,
      emeraldSpectrum.emerald800,
    ], // Use theme primary
    lightColor: emeraldSpectrum.emerald100,
    darkColor: emeraldSpectrum.emerald800,
  },
  {
    id: "other",
    label: "Other",
    period: "other",
    icon: <MoreHorizontal size={24} color="#ffffff" />,
    colors: [colors.surfaceVariant, colors.textSecondary, colors.textTertiary], // Use theme neutral colors
    lightColor: colors.surfaceVariant,
    darkColor: colors.textSecondary,
  },
];

const TIME_RESTRICTIONS = {
  breakfast: { start: 5, end: 11.59 },
  lunch: { start: 12, end: 17.59 },
  dinner: { start: 18, end: 21.59 },
  late_night: { start: 22, end: 4.59 },
  snack: { start: 0, end: 23.59 },
  other: { start: 0, end: 23.59 },
};

const formatTimeString = (hour: number): string => {
  const wholeHour = Math.floor(hour);
  const minutes = Math.floor((hour - wholeHour) * 60);

  if (wholeHour === 0)
    return minutes > 0
      ? `12:${minutes.toString().padStart(2, "0")} AM`
      : "12:00 AM";
  if (wholeHour < 12)
    return minutes > 0
      ? `${wholeHour}:${minutes.toString().padStart(2, "0")} AM`
      : `${wholeHour}:00 AM`;
  if (wholeHour === 12)
    return minutes > 0
      ? `12:${minutes.toString().padStart(2, "0")} PM`
      : "12:00 PM";
  return minutes > 0
    ? `${wholeHour - 12}:${minutes.toString().padStart(2, "0")} PM`
    : `${wholeHour - 12}:00 PM`;
};

const getCurrentHour = (): number => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};

const isMealTypeAvailable = (mealTypeId: string): boolean => {
  if (mealTypeId === "snack" || mealTypeId === "other") return true;

  const currentHour = getCurrentHour();
  const restriction =
    TIME_RESTRICTIONS[mealTypeId as keyof typeof TIME_RESTRICTIONS];

  if (!restriction) return true;

  if (restriction.start > restriction.end) {
    return currentHour >= restriction.start || currentHour <= restriction.end;
  }

  return currentHour >= restriction.start && currentHour <= restriction.end;
};

const getTimeRangeString = (mealTypeId: string): string => {
  const restriction =
    TIME_RESTRICTIONS[mealTypeId as keyof typeof TIME_RESTRICTIONS];
  if (!restriction || mealTypeId === "snack" || mealTypeId === "other")
    return "Available anytime";

  const startTime = formatTimeString(restriction.start);
  const endTime = formatTimeString(restriction.end);

  return `${startTime} - ${endTime}`;
};

const getNextAvailableTime = (mealTypeId: string): string => {
  const restriction =
    TIME_RESTRICTIONS[mealTypeId as keyof typeof TIME_RESTRICTIONS];
  if (!restriction) return "";

  return formatTimeString(restriction.start);
};

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const MealCard: React.FC<{
  mealType: MealType;
  isSelected: boolean;
  isAvailable: boolean;
  onPress: () => void;
  index: number;
  colors: any;
}> = ({ mealType, isSelected, isAvailable, onPress, index, colors }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotateY: `${rotateY.value}deg` }],
    opacity: opacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [1, 0.95], [1, 1.1]) }],
  }));

  const handlePress = () => {
    if (!isAvailable) {
      // Shake animation for unavailable items
      scale.value = withSpring(0.95, { duration: 100 });
      rotateY.value = withTiming(5, { duration: 100 }, () => {
        rotateY.value = withTiming(-5, { duration: 100 }, () => {
          rotateY.value = withTiming(0, { duration: 100 });
          scale.value = withSpring(1);
        });
      });

      if (Platform.OS !== "web") {
        runOnJS(Haptics.notificationAsync)(
          Haptics.NotificationFeedbackType.Warning
        );
      }
      return;
    }

    // Success animation
    scale.value = withSpring(0.95, { duration: 150 }, () => {
      scale.value = withSpring(1, { duration: 200 });
    });

    if (Platform.OS !== "web") {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const cardStyle = [
    styles.mealTypeCard,
    {
      backgroundColor: isSelected ? mealType.lightColor : colors.surface,
      borderColor: isSelected
        ? mealType.darkColor
        : isAvailable
        ? colors.border
        : colors.outline,
      shadowColor: isSelected ? mealType.darkColor : colors.shadow,
      shadowOpacity: isSelected ? 0.15 : 0.05,
      shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
      shadowRadius: isSelected ? 12 : 4,
      elevation: isSelected ? 8 : 2,
    },
    !isAvailable && styles.unavailableCard,
  ];

  return (
    <AnimatedTouchableOpacity
      entering={FadeIn.delay(index * 100).springify()}
      style={[animatedStyle, cardStyle]}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <LinearGradient
          colors={
            (isAvailable
              ? mealType.colors.slice(1)
              : [colors.textTertiary, colors.muted]) as [
              string,
              string,
              ...string[]
            ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          {React.cloneElement(
            mealType.icon as React.ReactElement<{
              color?: string;
              size?: number;
            }>,
            {
              color: "#FFFFFF",
              size: 28,
            }
          )}
        </LinearGradient>
      </Animated.View>

      <Text
        style={[
          styles.label,
          {
            color: isAvailable ? mealType.darkColor : colors.textTertiary,
            fontWeight: isSelected ? "700" : "600",
          },
        ]}
      >
        {mealType.label}
      </Text>

      <Text
        style={[
          styles.timeRange,
          {
            color: isAvailable ? mealType.colors[1] : colors.textTertiary,
          },
        ]}
      >
        {getTimeRangeString(mealType.id)}
      </Text>

      {!isAvailable && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.unavailableContainer}
        >
          <AlertCircle size={14} color={colors.error} />
          <Text style={[styles.unavailableText, { color: colors.error }]}>
            Available at {getNextAvailableTime(mealType.id)}
          </Text>
        </Animated.View>
      )}

      {isSelected && (
        <Animated.View
          entering={FadeIn.springify()}
          style={[
            styles.selectedIndicator,
            { backgroundColor: mealType.darkColor },
          ]}
        />
      )}
    </AnimatedTouchableOpacity>
  );
};

export const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({
  onSelect,
  selectedType,
}) => {
  const { colors, emeraldSpectrum } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get meal types with theme colors
  const MEAL_TYPES = useMemo(
    () => getMealTypesWithTheme(colors, emeraldSpectrum),
    [colors, emeraldSpectrum]
  );

  const mealAvailability = useMemo(() => {
    return MEAL_TYPES.reduce((acc, mealType) => {
      acc[mealType.id] = isMealTypeAvailable(mealType.id);
      return acc;
    }, {} as Record<string, boolean>);
  }, [currentTime, MEAL_TYPES]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleMealTypeSelect = (mealType: MealType) => {
    if (mealAvailability[mealType.id]) {
      onSelect(mealType);
    }
  };

  const currentTimeString = useMemo(() => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const themedStyles = StyleSheet.create({
    container: {
      minHeight: "100%",
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: 32,
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: "center",
      lineHeight: 24,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currentTime: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      fontWeight: "600",
    },
  });

  return (
    <ScrollView style={themedStyles.container}>
      <Animated.View entering={FadeIn.delay(50)} style={themedStyles.header}>
        <Text style={themedStyles.title}>Select Meal Type</Text>
        <Text style={themedStyles.subtitle}>
          Choose the type of meal you're capturing
        </Text>
        <View style={themedStyles.timeContainer}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={themedStyles.currentTime}>
            Current time: {currentTimeString}
          </Text>
        </View>
      </Animated.View>

      <View>
        {MEAL_TYPES.map((mealType, index) => (
          <MealCard
            key={mealType.id}
            mealType={mealType}
            isSelected={selectedType?.id === mealType.id}
            isAvailable={mealAvailability[mealType.id]}
            onPress={() => handleMealTypeSelect(mealType)}
            index={index}
            colors={colors}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mealTypeCard: {
    width: "auto",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  iconContainer: {
    marginBottom: 16,
    position: "relative",
  },
  blurOverlay: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    zIndex: 1,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  timeRange: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 4,
  },
  unavailableCard: {
    opacity: 0.7,
  },
  unavailableContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  selectedIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

// Export the function to get meal types with theme (for use in other components)
export { getMealTypesWithTheme };
