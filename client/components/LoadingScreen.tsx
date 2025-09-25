import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

interface LoadingScreenProps {
  text?: string;
  size?: "small" | "large";
  appName?: string;
}

// iOS-style minimal icons with refined emerald colors
const LeafIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M20 75C20 45 35 20 50 20C65 20 80 45 80 75C80 80 75 85 70 85L30 85C25 85 20 80 20 75Z"
      fill="url(#leafGrad)"
    />
    <Path d="M50 20L50 85" stroke="#047857" strokeWidth="1" opacity="0.5" />
  </Svg>
);

const SeedlingIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="seedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 80L50 40"
      stroke="#047857"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Path
      d="M50 45C40 35 25 40 30 55C35 65 50 60 50 45Z"
      fill="url(#seedGrad)"
    />
    <Path
      d="M50 45C60 35 75 40 70 55C65 65 50 60 50 45Z"
      fill="url(#seedGrad)"
    />
  </Svg>
);

const TreeIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 85L50 55"
      stroke="#047857"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Circle cx="50" cy="30" r="18" fill="url(#treeGrad)" />
    <Circle cx="36" cy="44" r="13" fill="url(#treeGrad)" opacity="0.9" />
    <Circle cx="64" cy="44" r="13" fill="url(#treeGrad)" opacity="0.9" />
  </Svg>
);

const FlowerIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 85L50 45"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="50" cy="35" r="5" fill="#f59e0b" />
    <Ellipse cx="50" cy="22" rx="7" ry="13" fill="url(#flowerGrad)" />
    <Ellipse
      cx="36"
      cy="35"
      rx="7"
      ry="13"
      fill="url(#flowerGrad)"
      transform="rotate(-72 36 35)"
    />
    <Ellipse
      cx="64"
      cy="35"
      rx="7"
      ry="13"
      fill="url(#flowerGrad)"
      transform="rotate(72 64 35)"
    />
    <Ellipse
      cx="43"
      cy="48"
      rx="7"
      ry="13"
      fill="url(#flowerGrad)"
      transform="rotate(-144 43 48)"
    />
    <Ellipse
      cx="57"
      cy="48"
      rx="7"
      ry="13"
      fill="url(#flowerGrad)"
      transform="rotate(144 57 48)"
    />
  </Svg>
);

const icons = [LeafIcon, SeedlingIcon, TreeIcon, FlowerIcon];

export default function LoadingScreen({
  text = "Loading...",
  size = "large",
  appName = "Calo",
}: LoadingScreenProps) {
  const { colors, isDark } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const iconRotateAnim = React.useRef(new Animated.Value(0)).current;
  const iconScaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const [currentIcon, setCurrentIcon] = React.useState(0);

  React.useEffect(() => {
    // iOS-style fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Gentle iOS-style icon scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation
    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    // iOS-style progress animation
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ).start();

    // Gentle pulse for dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon cycling
    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 1800);

    return () => clearInterval(iconInterval);
  }, []);

  const CurrentIcon = icons[currentIcon];

  const rotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  const dynamicStyles = createDynamicStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* iOS-style main icon container */}
        <Animated.View
          style={[
            styles.iconContainer,
            dynamicStyles.iconContainer,
            {
              transform: [{ scale: iconScaleAnim }, { rotate: rotation }],
            },
          ]}
        >
          <CurrentIcon size={56} />
        </Animated.View>

        {/* iOS-style loading text */}
        <Text style={[styles.loadingText, { color: colors.text }]}>{text}</Text>

        {/* iOS-style progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, dynamicStyles.progressTrack]}>
            <Animated.View
              style={[
                styles.progressBar,
                dynamicStyles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* iOS-style animated dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                dynamicStyles.dot,
                {
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.7, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const createDynamicStyles = (colors: any) =>
  StyleSheet.create({
    iconContainer: {
      backgroundColor: colors.surface,
      shadowColor: colors.primary,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    progressTrack: {
      backgroundColor: colors.border,
    },
    progressBar: {
      backgroundColor: colors.primary,
    },
    dot: {
      backgroundColor: colors.primary,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 28,
  },
  iconContainer: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressTrack: {
    width: 160,
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 1,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
