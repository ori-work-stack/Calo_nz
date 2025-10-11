import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { nutritionAPI } from "@/src/services/api";
import { MessageSquare, Camera } from "lucide-react-native";

interface UsageStats {
  subscriptionType: string;
  mealScans: {
    current: number;
    limit: number;
    remaining: number;
  };
  aiChat: {
    current: number;
    limit: number | null;
    remaining: number | null;
    messagesEstimate?: number;
  };
}

export default function UsageStatsWidget() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await nutritionAPI.getUsageStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  const mealPercentage =
    (stats.mealScans.current / stats.mealScans.limit) * 100;
  const aiPercentage = stats.aiChat.limit
    ? (stats.aiChat.current / stats.aiChat.limit) * 100
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t("common.usageThisMonth")}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Camera size={20} color="#10B981" />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t("common.mealScans")}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.mealScans.current}/{stats.mealScans.limit}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(mealPercentage, 100)}%` },
              ]}
            />
          </View>
        </View>

        {stats.aiChat.limit && (
          <View style={styles.statItem}>
            <View style={styles.iconContainer}>
              <MessageSquare size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("common.aiChat")}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.subscriptionType === "GOLD"
                ? `${Math.floor(stats.aiChat.current / 100)}/${
                    stats.aiChat.messagesEstimate
                  }`
                : `${stats.aiChat.current}/${stats.aiChat.limit} tokens`}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(aiPercentage, 100)}%`,
                    backgroundColor: "#3B82F6",
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.planBadge, { color: colors.textSecondary }]}>
        {stats.subscriptionType} Plan
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  planBadge: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
