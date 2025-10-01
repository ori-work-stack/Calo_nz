import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  TrendingUp,
  Heart,
  CircleAlert as AlertCircle,
} from "lucide-react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface HealthInsightsProps {
  recommendations?: string;
  healthNotes?: string;
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({
  recommendations,
  healthNotes,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!recommendations && !healthNotes) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Heart size={20} color="#10B981" />
        </View>
        <View>
          <Text style={styles.title}>Health Insights</Text>
          <Text style={styles.subtitle}>AI-powered recommendations</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <TrendingUp size={18} color="#10B981" />
          </View>
          <Text style={styles.insightText}>
            {recommendations || healthNotes}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A2744",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7E99",
    fontWeight: "500",
    marginTop: 2,
  },
  content: {},
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#1A2744",
    fontWeight: "500",
  },
});
